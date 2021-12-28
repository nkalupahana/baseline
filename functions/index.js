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

exports.moodLog = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Authorization');

    // Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    await validateAuth(req, res);
    if (!req.user) return;
    const data = JSON.parse(req.body);

    // Mood validation
    if (typeof data.mood !== "number" || data.mood < -5 || data.mood > 5 || data.mood !== parseInt(data.mood)) {
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

    const userNow = globalNow.setZone(data.timezone);

    const db = admin.database();
    await db.ref(`/${req.user.user_id}/logs/${globalNow.toMillis()}`).set({
        year: userNow.year,
        month: userNow.month,
        day: userNow.day,
        time: userNow.toLocaleString(DateTime.TIME_SIMPLE),
        zone: userNow.zone.offsetName(userNow.toMillis(), {format: "short"}),
        mood: data.mood,
        journal: data.journal,
        average: data.average
    });

    await db.ref(`/${req.user.user_id}/lastUpdated`).set(globalNow.toMillis());
    
    res.send(200);
});

exports.moodLogNext = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Authorization');

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

        const sharp = require("sharp");
        const { v4: uuidv4 } = require("uuid");
        let promises = [];
        for (let file of files) {
            // Convert file to WEBP (with compression), and then save
            // Promises array for parallel processing
            try {
                promises.push(sharp(file.path).webp().toBuffer().then(buf => {
                    const fileName = `${uuidv4()}.webp`;
                    filePaths.push(fileName);
                    return admin.storage().bucket().file(`user/${req.user.user_id}/${fileName}`).save(buf);
                }));
            } catch (e) {
                res.status(400).send(e);
                return;
            }
        }

        // Wait for all uploads to complete
        try {
            await Promise.all(promises);
        } catch (e) {
            res.status(400).send(e);
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
        zone: userNow.zone.offsetName(userNow.toMillis(), {format: "short"}),
        mood: data.mood,
        journal: data.journal,
        average: data.average,
        files: filePaths
    });

    await db.ref(`/${req.user.user_id}/lastUpdated`).set(globalNow.toMillis());
    res.sendStatus(200);
});
