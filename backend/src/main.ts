import { Response } from "express";
import { UserRequest, validateKeys } from "./helpers.js";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import { AES } from "crypto-js";
import aesutf8 from "crypto-js/enc-utf8.js";
import { DateTime } from "luxon";
import formidable from "formidable";
import sharp from "sharp";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";

export const getImage = async (req: UserRequest, res: Response) => {
    const db = getDatabase();

    const body = req.body;
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);
    if (!encryptionKey) {
        res.send(400);
        return;
    }

    const filename = body.filename;
    // Max length: 32-char UUID.webp.enc
    if (typeof filename !== "string" || filename.length > 45) {
        res.send(400);
        return;
    }

    let file;
    try {
        file = await getStorage().bucket().file(`user/${req.user!.uid}/${filename}`).download();
    } catch {
        // File doesn't exist, fail
        res.send(400);
        return;
    }

    // Null check for type safety
    if (!file) {
        res.send(400);
        return;
    }

    if (filename.endsWith(".enc")) {
        res.send(AES.decrypt(file[0].toString("utf8"), encryptionKey).toString(aesutf8));
    } else {
        res.send(`data:image/webp;base64,${file[0].toString("base64")}`);
    }
}

export const survey = async (req: UserRequest, res: Response) => {
    const body = req.body;
    const db = getDatabase();
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
        },
        wastv1: {
            type: "number",
            min: 0,
            max: 24
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

    const RESULT_VAL = VALIDATION[body.key as ("dassv1" | "edev1" | "harmv1" | "cagev1" | "spfv1" | "wastv1")];
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
}

export const moodLog = async (req: UserRequest, res: Response) => {
    let { data, files }: any = await new Promise((resolve, reject) => {
        formidable({ keepExtensions: true, multiples: true }).parse(req, (err: Error, fields: any, files: any) => {
            if (err) {
                reject(err);
                return;
            }

            resolve({ fields, files });
        });
    });

    const db = getDatabase();
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
    const MAX_CHARS = 25000;
    if (typeof data.journal !== "string" || data.journal.length > MAX_CHARS) {
        res.status(400).send(`Please keep journals below ${MAX_CHARS} characters. You can split up your journal into multiple logs if you need to.`);
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
                            const fileName = `${uuidv4()}.webp.enc`;
                            filePaths.push(fileName);
                            const data = AES.encrypt(`data:image/webp;base64,${buf.toString("base64")}`, encryptionKey).toString();
                            return getStorage().bucket().file(`user/${req.user!.user_id}/${fileName}`).save(data);
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
}