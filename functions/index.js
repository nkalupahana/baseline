const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { DateTime } = require("luxon");
admin.initializeApp();

const validateAuth = async (req, res) => {
    if ((!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) && !(req.cookies && req.cookies.__session)) {
        res.status(403).send("Unauthorized");
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
        idToken = req.cookies.__session;
    } else {
        res.status(403).send("Unauthorized");
        return;
    }

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        return;
    } catch (error) {
        console.log(error);
        res.status(403).send("Unauthorized");
        return;
    }
};

exports.moodLog = functions.runWith({ memory: "2GB" }).https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization");

    // Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    await validateAuth(req, res);
    if (!req.user) return;

    const formidable = require("formidable-serverless");
    let [data, files] = await new Promise((resolve, reject) => {
        new formidable.IncomingForm({ keepExtensions: true, multiples: true }).parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
                return;
            }

            resolve([fields, files]);
        });
    });

    // Mood validation
    data.mood = Number(data.mood);
    if (typeof data.mood !== "number" || isNaN(data.mood) || data.mood < -5 || data.mood > 5 || data.mood !== parseInt(data.mood)) {
        res.send(400);
        return;
    }

    // Journal validation
    const MAX_CHARS = 10000;
    if (typeof data.journal !== "string" || data.journal.length > MAX_CHARS) {
        res.status(400).send(`Please keep journals below ${MAX_CHARS} characters.`);
        return;
    }

    // Average validation
    const acceptedAverages = ["below", "average", "above"];
    if (typeof data.average !== "string" || !acceptedAverages.includes(data.average)) {
        res.send(400);
        return;
    }

    const globalNow = DateTime.utc();

    // Timezone validation
    if (typeof data.timezone !== "string" || !globalNow.setZone(data.timezone).isValid) {
        res.send(400);
        return;
    }

    let filePaths = [];
    files = files["file"];
    // If user has screenshots:
    if (files) {
        // If there's only one, they'll be given as just an object,
        // so put them into an array
        if (!Array.isArray(files)) files = [files];
        // Validate file limit
        if (files.length > 3) {
            res.send(400);
            return;
        }

        const fs = require("fs");
        const sharp = require("sharp");
        const { v4: uuidv4 } = require("uuid");
        let promises = [];
        for (let file of files) {
            // Convert file to WEBP (with compression), and then save
            // Promises array for parallel processing
            try {
                promises.push(
                    sharp(file.path)
                        .rotate()
                        .webp()
                        .toBuffer()
                        .then((buf) => {
                            // Clean up temp file: https://firebase.google.com/docs/functions/tips#always_delete_temporary_files
                            fs.rmSync(file.path);

                            // Upload
                            const fileName = `${uuidv4()}.webp`;
                            filePaths.push(fileName);
                            return admin.storage().bucket().file(`user/${req.user.user_id}/${fileName}`).save(buf);
                        })
                );
            } catch (e) {
                res.status(400).send(e.message);
                return;
            }
        }

        // Wait for all uploads to complete
        try {
            await Promise.all(promises);
        } catch (e) {
            res.status(400).send(e.message);
            return;
        }
    }

    const userNow = globalNow.setZone(data.timezone);

    const db = admin.database();
    await db.ref(`/${req.user.user_id}/logs/${globalNow.toMillis()}`).set({
        year: userNow.year,
        month: userNow.month,
        day: userNow.day,
        time: userNow.toLocaleString(DateTime.TIME_SIMPLE),
        zone: userNow.zone.name,
        mood: data.mood,
        journal: data.journal,
        average: data.average,
        files: filePaths,
    });

    await db.ref(`/${req.user.user_id}/lastUpdated`).set(globalNow.toMillis());
    res.sendStatus(200);
});

exports.survey = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization");

    // Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    await validateAuth(req, res);
    if (!req.user) return;

    const body = JSON.parse(req.body);

    // Valid surveys, and
    // validation parameters for each one
    const VALIDATION = {
        dassv1: {
            type: "object",
            keys: ["d", "a", "s"],
            min: [0, 0, 0],
            max: [21, 21, 21]
        },
        edev1: {
            type: "number",
            min: 0,
            max: 36
        },
        harmv1: {
            type: "object",
            keys: [0, 1, 2],
            min: [0, 0, 0],
            max: [1, 1, 1]
        },
        cagev1: {
            type: "number",
            min: 0,
            max: 12
        },
        spfv1: {
            type: "object",
            keys: ["Social-Interpersonal", "Cognitive-Individual"],
            min: [6, 6],
            max: [30, 30]
        }
    };

    // Validate survey key (is it one we know about/still accept?)
    if (!("key" in body) || typeof body.key !== "string" || !(body.key in VALIDATION)) {
        res.send(400);
        return;
    }

    // Validate presence of results of survey
    if (!("results" in body)) {
        res.send(400);
        return;
    }

    const RESULT_VAL = VALIDATION[body.key];
    const results = body.results;
    if (RESULT_VAL.type === "number") {
        // Result should be a number

        // Validate that result is a number, and that it's within bounds
        if (typeof results !== "number" || isNaN(results) || results < RESULT_VAL.min || results > RESULT_VAL.max) {
            res.send(400);
            return;
        }
    } else if (RESULT_VAL.type === "object") {
        // Result should be an object with keys and numeric values

        // Validate that result is an object
        if (typeof results !== "object") {
            res.send(400);
            return;
        }

        // Validate that result has the right keys
        let keys = JSON.parse(JSON.stringify(RESULT_VAL.keys));
        for (let key in results) {
            if (!isNaN(Number(key))) key = Number(key);
            if (!keys.includes(key)) {
                res.send(400);
                return;
            }

            keys.splice(keys.indexOf(key), 1);
        }

        if (keys.length !== 0) {
            res.send(400);
            return;
        }

        // Validate that result values are numbers, and that they're within bounds
        for (let key of RESULT_VAL.keys) {
            if (typeof results[key] !== "number" || isNaN(results[key]) || results[key] < RESULT_VAL.min[key] || results[key] > RESULT_VAL.max[key]) {
                res.send(400);
                return;
            }
        }
    }

    // Add survey to database
    const db = admin.database();
    await db.ref(`/${req.user.user_id}/surveys/${DateTime.utc().toMillis()}`).set({
        key: body.key,
        results: body.results
    });

    res.send(200);
});

exports.cleanUpAnonymous = functions.runWith({ timeoutSeconds: 540 }).pubsub.schedule("0 0 * * SUN").timeZone("America/Chicago").onRun(async _ => {
    let promises = [];
    let usersToDelete = [];

    const listAllUsers = (nextPageToken) => {
        return admin.auth()
            .listUsers(1000, nextPageToken)
            .then(async listUsersResult => {
                listUsersResult.users.forEach((userRecord) => {
                    const userData = userRecord.toJSON();
                    if (userData.providerData.length === 0) {
                        // Anonymous account -- delete artifacts and get UID for deletion from Auth
                        promises.push(admin.database().ref(`/${userData.uid}`).remove());
                        promises.push(admin.storage().bucket().deleteFiles({ prefix: `user/${userData.uid}` }));
                        usersToDelete.push(userData.uid);
                    }
                });
                
                // List next batch of users, if it exists.
                if (listUsersResult.pageToken) {
                    await listAllUsers(listUsersResult.pageToken);
                }
            })
            .catch((error) => {
                console.log("Error listing users:", error);
            });
    };

    // Get users, and wait for user data deletion to finish
    await listAllUsers();
    await Promise.all(promises);

    // Auth deletion is rate-limited, so delete accounts at 8/second
    while (usersToDelete.length > 0) {
        let promises = [];
        for (let i = 0; i < 8 && usersToDelete.length !== 0; i++) {
            promises.push(admin.auth().deleteUser(usersToDelete.pop()));
        }

        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

exports.sendCleanUpMessage = functions.pubsub.schedule("0 */2 * * *").timeZone("America/Chicago").onRun(async _ => {
    await admin.messaging().send({
        topic: "all",
        apns: {
            payload: {
                aps: {
                    contentAvailable: true,
                }
            },
        },
        data: {
            cleanUp: "true"
        }
    });
});