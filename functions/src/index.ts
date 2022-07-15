import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Database } from "firebase-admin/lib/database/database";
import * as AES from "crypto-js/aes";
import * as aesutf8 from "crypto-js/enc-utf8";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { DateTime } from "luxon";
import * as fs from "fs";
import { UserRecord } from "firebase-functions/v1/auth";
import nfetch from "node-fetch";
import * as bcrypt from "bcryptjs";
import * as random from "crypto-random-string";
import * as formidable from "formidable-serverless";
import { v4 as uuidv4 } from "uuid";
import * as sharp from "sharp";
import { auth as googleauth , sheets } from "@googleapis/sheets";
import { BigQuery } from "@google-cloud/bigquery";
import { Storage } from "@google-cloud/storage";

admin.initializeApp();
const quotaApp = admin.initializeApp({
    databaseURL: "https://getbaselineapp-quotas.firebaseio.com/"
}, "quota")

export interface Request extends functions.https.Request {
    user?: DecodedIdToken;
}

const TOKENS: any = {
    web: "d43e4a0f0eac5ab776190238b97c415e847d045760d3608d75994379dd02a565",
    android: "07441aa58144eecb74f973795899f223e06a8306d109cfd496aa59372d5a200f",
    ios: "2a0a11d8b842c93e6e14c7a0e00cd7d9d2afac12917281a9f8ae845c17d4fc4a"
};

const CLOUDKIT: any = {
    ENV: "production",
    ID: "iCloud.baseline.getbaseline.app",
    BASE: "https://api.apple-cloudkit.com"
};

const validateAuth = async (req: Request, res: functions.Response<any>) => {
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

const validateKeys = async (keys_: string, db: Database, user_id: string) => {
    if (typeof keys_ !== "string") {
        return false;
    }

    let keys;
    try {
        keys = JSON.parse(keys_);
    } catch {
        return false;
    }

    if (!keys || Object.keys(keys).length !== 3) {
        return false;
    }

    for (const key of ["visibleKey", "encryptedKey", "encryptedKeyVisible"]) {
        if (!(key in keys) || typeof keys[key] !== "string") {
            return false;
        }
    }

    const encryptionData = await (await db.ref(`/${user_id}/encryption`).get()).val();

    if (!bcrypt.compareSync(keys.encryptedKey, encryptionData.encryptedKeyHash)) {
        return false;
    }

    if (!process.env.KEY_ENCRYPTION_KEY) {
        throw Error("Encryption key not set in env!");
    }

    if (AES.decrypt(keys.encryptedKey, process.env.KEY_ENCRYPTION_KEY).toString(aesutf8) !== keys.encryptedKeyVisible) {
        return false;
    }

    return `${keys.visibleKey}${keys.encryptedKeyVisible}`;
}

const checkQuota = async (req: Request, res: functions.Response<any>) => {
    const user = req.user!.user_id;
    const db = admin.database(quotaApp);
    const now = DateTime.now();
    const minute = now.hour * 60 + now.minute;
    const ref = db.ref(`/${user}:${minute}`);
    const numVals = Object.keys((await (await ref.get()).val()) ?? {}).length;
    if (numVals > 60) {
        res.status(429).send("Rate limit, try again in a minute.");
        return false;
    }
    ref.push("q");
    return true;
}

export const cleanUpQuotas = functions.pubsub.schedule("0 0 * * *").timeZone("America/Chicago").onRun(async _ => {
    await admin.database(quotaApp).ref("/").set({});
});

const preflight = async (req: Request, res: functions.Response<any>): Promise<boolean> => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization");

    // CORS Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return false;
    }

    await validateAuth(req, res);
    if (!req.user) return false;
    if (await checkQuota(req, res) === false) return false;
    return true;
};

export const moodLog = functions.runWith({ memory: "2GB", secrets: ["KEY_ENCRYPTION_KEY"], minInstances: 1 }).https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    let [data, files] = await new Promise((resolve, reject) => {
        new formidable.IncomingForm({ keepExtensions: true, multiples: true }).parse(req, (err: Error, fields: any, files: any) => {
            if (err) {
                reject(err);
                return;
            }

            resolve([fields, files]);
        });
    });

    const db = admin.database();
    const encryptionKey = await validateKeys(data.keys, db, req.user!.user_id);

    if (!encryptionKey) {
        res.send(400);
        return;
    }

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

    let filePaths: string[] = [];
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

        let promises = [];
        for (const file of files) {
            // Convert file to WEBP (with compression), and then save
            // Promises array for parallel processing
            try {
                promises.push(
                    sharp(file.path)
                        .rotate()
                        .webp()
                        .toBuffer()
                        .then((buf: Buffer) => {
                            // Clean up temp file: https://firebase.google.com/docs/functions/tips#always_delete_temporary_files
                            fs.rmSync(file.path);

                            // Upload
                            const fileName = `${uuidv4()}.webp`;
                            filePaths.push(fileName);
                            return admin.storage().bucket().file(`user/${req.user!.user_id}/${fileName}`).save(buf);
                        })
                );
            } catch (e: any) {
                res.status(400).send(e.message);
                return;
            }
        }

        // Wait for all uploads to complete
        try {
            await Promise.all(promises);
        } catch (e: any) {
            res.status(400).send(e.message);
            return;
        }
    }

    const userNow = globalNow.setZone(data.timezone);
    const logData = {
        year: userNow.year,
        month: userNow.month,
        day: userNow.day,
        time: userNow.toLocaleString(DateTime.TIME_SIMPLE),
        zone: userNow.zone.name,
        mood: data.mood,
        journal: data.journal,
        average: data.average,
        files: filePaths,
    };

    await db.ref(`/${req.user!.user_id}/logs/${globalNow.toMillis()}`).set({
        data: AES.encrypt(JSON.stringify(logData), encryptionKey).toString()
    });

    await db.ref(`/${req.user!.user_id}/lastUpdated`).set(globalNow.toMillis());
    res.sendStatus(200);
});

export const survey = functions.runWith({ secrets: ["KEY_ENCRYPTION_KEY"], minInstances: 1 }).https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    const body = JSON.parse(req.body);

    const db = admin.database();
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);

    if (!encryptionKey) {
        res.send(400);
        return;
    }

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

    const RESULT_VAL = VALIDATION[body.key as ("dassv1" | "edev1" | "harmv1" | "cagev1" | "spfv1")];
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
        if (!("keys" in RESULT_VAL)) {
            throw Error("Result dictionary type mismatch -- check configuration.");
        }

        let keys = JSON.parse(JSON.stringify(RESULT_VAL.keys));
        for (const key_ in results) {
            const key = isNaN(Number(key_)) ? key_ : Number(key_);
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
        for (const key of RESULT_VAL.keys) {
            if (
                typeof results[key] !== "number" || 
                isNaN(results[key]) || 
                results[key] < RESULT_VAL.min[key as number] || 
                results[key] > RESULT_VAL.max[key as number]
            ) {
                res.send(400);
                return;
            }
        }
    }

    // Add survey to database
    await db.ref(`/${req.user!.user_id}/surveys/${DateTime.utc().toMillis()}`).set({
        key: body.key,
        results: AES.encrypt(JSON.stringify(body.results), encryptionKey).toString()
    });

    res.send(200);
});

export const cleanUpAnonymous = functions.runWith({ timeoutSeconds: 540 }).pubsub.schedule("0 0 * * SUN").timeZone("America/Chicago").onRun(async _ => {
    let promises: Promise<any>[] = [];
    let usersToDelete: string[]  = [];

    const listAllUsers = (nextPageToken?: string) => {
        return admin.auth()
            .listUsers(1000, nextPageToken)
            .then(async listUsersResult => {
                listUsersResult.users.forEach((userRecord) => {
                    const userData = userRecord.toJSON() as UserRecord;
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
            promises.push(admin.auth().deleteUser(usersToDelete.pop()!));
        }

        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

export const sendCleanUpMessage = functions.pubsub.schedule("0 */2 * * *").timeZone("America/Chicago").onRun(async _ => {
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

export const gapFund = functions.runWith({ secrets: ["KEY_ENCRYPTION_KEY"] }).https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    const body = JSON.parse(req.body);
    
    const db = admin.database();
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);

    if (!encryptionKey) {
        res.send(400); 
        return;
    }

    // Validation
    for (const key of ["email", "need", "amount", "method"]) {
        if (typeof body[key] !== "string" || body[key].trim().length === 0 || body[key].length >= 10000) {
            res.send(400);
            return;
        }
    }

    // Get user statistics for fraud detection
    const logRef = db.ref(`/${req.user!.user_id}/logs`);
    const firstLog = Number(Object.keys(await (await logRef.limitToFirst(1).get()).val())[0]);

    const lastLogs = await (await logRef.limitToLast(25).get()).val();
    let lastLogStr = "";
    for (const key in lastLogs) {
        lastLogStr += DateTime.fromMillis(Number(key)).toRFC2822() + "\n";
    }

    // Simple date validation (real fraud detection will be done manually in the sheet)
    if (Object.keys(lastLogs).length < 7 || DateTime.now().minus({ days: 5 }).toMillis() < firstLog) {
        res.send(400);
        return;
    }

    // Put data in user's database
    const gapFundRef = db.ref(`/${req.user!.user_id}/gapFund`);
    const currentData = await (await gapFundRef.get()).val();
    if (currentData) {
        res.send(400);
        return;
    }

    const data = {
        email: body.email,
        need: body.need,
        amount: body.amount,
        method: body.method
    };

    await gapFundRef.set({
        data: AES.encrypt(JSON.stringify(data), encryptionKey).toString()
    });

    // Write to spreadsheet
    const auth = await googleauth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const api = sheets({ version: 'v4', auth });
    await api.spreadsheets.values.append({
        spreadsheetId: "1N3Ecex6TVeWQvd1uKBNtf__XBASx47i5wBktTSbjdus",
        range: "A2:J9999",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[
                req.user!.user_id, 
                body.email, 
                body.need, 
                body.amount, 
                body.method, 
                lastLogStr, // Last log dates
                DateTime.fromMillis(Number(firstLog)).toRFC2822(), // First log
                "New", // Status
                "Needs Review ASAP", // Progression
                `https://console.firebase.google.com/u/0/project/getbaselineapp/database/getbaselineapp-default-rtdb/data/${req.user!.user_id}~2FgapFund`
            ]]
        }
    });

    res.send(200);
});

export const getOrCreateKeys = functions.runWith({ secrets: ["KEY_ENCRYPTION_KEY"], minInstances: 1 }).https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;
    
    const body = JSON.parse(req.body);
    if (typeof body.credential !== "object" || typeof body.credential.providerId !== "string" || typeof body.credential.accessToken !== "string") {
        res.send(400);
        return;
    }

    if (!["google.com", "apple.com", "anonymous"].includes(body.credential.providerId)) {
        res.send(400);
        return;
    }

    if (typeof body.platform !== "string" || !["ios", "android", "web"].includes(body.platform)) {
        res.send(400);
        return;
    }
    
    const db = admin.database();
    const pdp = await (await db.ref(`/${req.user!.user_id}/pdp`).get()).val();
    if (pdp && typeof pdp === "object") {
        if (typeof body.passphrase !== "string" || !bcrypt.compareSync(body.passphrase, pdp.passphraseHash)) {
            res.status(401).send("Your passphrase is incorrect.");
            return;
        }
    }

    const encryptionData = await (await db.ref(`/${req.user!.user_id}/encryption`).get()).val();

    if (!process.env.KEY_ENCRYPTION_KEY) {
        res.send(500);
        return;
    }

    if (encryptionData) {
        if (body.credential.providerId === "google.com") {
            const response = await nfetch(`https://www.googleapis.com/drive/v3/files/${encryptionData.id}?fields=properties`, {
                headers: {
                    "Authorization": `Bearer ${body.credential.accessToken}`,
                }
            });

            if (!response) {
                res.send(400);
                return;
            }

            const respData = await response.json();
            if ("error" in respData || !("properties" in respData)) {
                const message = respData.error?.message?.toLowerCase();
                if (message && message.includes("insufficient") && message.includes("scopes")) {
                    res.send(428);
                } else {
                    res.send(400);
                }
                return;
            }

            const keys = respData["properties"];
            keys["encryptedKeyVisible"] = AES.decrypt(keys["encryptedKey"], process.env.KEY_ENCRYPTION_KEY).toString(aesutf8);
            res.send(keys);
            return;
        } else if (body.credential.providerId === "apple.com") {
            const url = `${CLOUDKIT.BASE}/database/1/${CLOUDKIT.ID}/${CLOUDKIT.ENV}/private/records/lookup?ckAPIToken=${TOKENS[body.platform]}&ckWebAuthToken=${body.credential.accessToken}`;
            const response = await nfetch(url, {
                method: "POST",
                body: JSON.stringify({
                    "records": {
                        "recordName": "Keys",
                        "desiredFields": ["encryptedKey", "visibleKey"]
                    }
                })
            });
            let respData = await response.json();
            if ("serverErrorCode" in respData || !("records" in respData) || "serverErrorCode" in respData["records"][0]) {
                console.log("KEY GET FAIL");
                console.log(JSON.stringify(respData));
                res.send(400);
                return;
            }

            respData = respData["records"][0]["fields"];
            res.send({
                encryptedKey: respData["encryptedKey"]["value"],
                visibleKey: respData["visibleKey"]["value"],
                encryptedKeyVisible: AES.decrypt(respData["encryptedKey"]["value"], process.env.KEY_ENCRYPTION_KEY).toString(aesutf8)
            });
            return;
        } else if (body.credential.providerId === "anonymous") {
            // Anonymous users shouldn't be signing in again!
            res.send(400);
            return;
        }
    }

    const visibleKey = random({length: 32, type: "url-safe"});
    const encryptedKeyVisible = random({length: 32, type: "url-safe"});
    const encryptedKey = AES.encrypt(encryptedKeyVisible, process.env.KEY_ENCRYPTION_KEY).toString();
    let id: string = "";

    if (body.credential.providerId === "google.com") {
        const response = await nfetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            body: JSON.stringify({
                "parents": ["appDataFolder"],
                "name": "keys",
                "properties": {
                    visibleKey,
                    encryptedKey
                }
            }),
            headers: {
                "Authorization": `Bearer ${body.credential.accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const respData = await response.json();

        if ("error" in respData || !("id" in respData)) {
            const message = respData.error?.message?.toLowerCase();
            if (message && message.includes("insufficient") && message.includes("scopes")) {
                res.send(428);
            } else {
                res.send(400);
            }
            return;
        }

        id = respData["id"];
    } else if (body.credential.providerId === "apple.com") {
        const url = `${CLOUDKIT.BASE}/database/1/${CLOUDKIT.ID}/${CLOUDKIT.ENV}/private/records/modify?ckAPIToken=${TOKENS[body.platform]}&ckWebAuthToken=${body.credential.accessToken}`;
        const response = await nfetch(url, {
            method: "POST",
            body: JSON.stringify({
                operations: [{
                    operationType: "forceReplace",
                    record: {
                        recordType: "Keys",
                        recordName: "Keys",
                        fields: {
                            visibleKey: {
                                value: visibleKey,
                                recordType: "STRING"
                            },
                            encryptedKey: {
                                value: encryptedKey,
                                recordType: "STRING"
                            }
                        }
                    }
                }]
            })
        });

        const respData = await response.json();
        if (("serverErrorCode" in respData) || ("serverErrorCode" in respData["records"][0])) {
            console.log("KEY SET FAIL");
            console.log(JSON.stringify(respData));
            res.send(400);
            return;
        }

        id = "Keys";
    } else if (body.credential.providerId === "anonymous") {
        // No key storage for anonymous users -- their data is lost after they sign out
        id = "anonymous";
    }

    await db.ref(`${req.user!.user_id}/encryption`).set({
        encryptedKeyHash: bcrypt.hashSync(encryptedKey, bcrypt.genSaltSync(10)),
        id
    });

    res.send({
        visibleKey,
        encryptedKey,
        encryptedKeyVisible
    });
});

export const enablePDP = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;
    
    const body = JSON.parse(req.body);
    if (typeof body.passphrase !== "string" || body.passphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    if (await (await db.ref(`${req.user!.user_id}/pdp`).get()).val()) {
        res.send(400);
        return;
    }

    await db.ref(`${req.user!.user_id}/pdp`).set({
        passphraseHash: bcrypt.hashSync(body.passphrase),
        passphraseUpdate: Math.random(),
        method: "upfront"
    });

    res.send(200);
});

export const changePDPpassphrase = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;
    
    const body = JSON.parse(req.body);
    if (typeof body.oldPassphrase !== "string" || body.oldPassphrase.length < 6) {
        res.send(400);
        return;
    }

    if (typeof body.newPassphrase !== "string" || body.newPassphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    const oldHash = await (await db.ref(`${req.user!.user_id}/pdp/passphraseHash`).get()).val();
    if (!oldHash || !bcrypt.compareSync(body.oldPassphrase, oldHash)) {
        res.send(400);
        return;
    }

    await db.ref(`${req.user!.user_id}/pdp`).update({
        passphraseHash: bcrypt.hashSync(body.newPassphrase),
        passphraseUpdate: Math.random()
    });

    res.send(200);
});

export const removePDP = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;

    const body = JSON.parse(req.body);
    if (typeof body.passphrase !== "string" || body.passphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    const hash = await (await db.ref(`${req.user!.user_id}/pdp/passphraseHash`).get()).val();
    if (!hash || !bcrypt.compareSync(body.passphrase, hash)) {
        res.send(400);
        return;
    }
    
    await db.ref(`${req.user!.user_id}/pdp`).remove();
    res.send(200);
});

/* NON-PUBLIC */
// Load actions data into BigQuery
export const loadBIData = functions.pubsub.schedule("* 0,12 * * *").timeZone("America/Chicago").onRun(async _ => {
    const bigquery = new BigQuery();
    const storage = new Storage();
    // Get all data
    const db = (await admin.database().ref("/").get()).val();

    // Create CSV row with required data
    let actions: string[] = [];
    const addAction = (userId: string, timestamp: string, action: string) => {
        const dt = DateTime.fromMillis(Number(timestamp));
        actions.push([timestamp, userId, dt.toISODate(), dt.toLocaleString(DateTime.TIME_24_WITH_SECONDS), action].join(","));
    }

    // Go through all users, and add actions to CSV
    for (let userId in db) {
        if (!("encryption" in db[userId]) || db[userId]["encryption"]["id"] === "anonymous") continue;

        for (let timestamp in db[userId]["logs"] ?? {}) {
            addAction(userId, timestamp, "moodLog");
        }

        for (let timestamp in db[userId]["surveys"] ?? {}) {
            addAction(userId, timestamp, "survey");
        }
    }

    // Send CSV to storage
    await storage.bucket("baseline-bi").file("actions.csv").save(actions.join("\n"));

    // Send stored CSV to BigQuery
    const metadata = {
        sourceFormat: "CSV",
        schema: {
          fields: [
            { name: "timestamp", type: "INTEGER" },
            { name: "userId", type: "STRING" },
            { name: "date", type: "DATE" },
            { name: "time", type: "TIME" },
            { name: "action", type: "STRING" }
          ],
        },
        location: "US",
        writeDisposition: "WRITE_TRUNCATE"
    };
    await bigquery.dataset("bi").table("actions").load(storage.bucket("baseline-bi").file("actions.csv"), metadata);
});