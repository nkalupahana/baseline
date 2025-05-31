import { Response } from "express";
import { AnyMap, UserRequest, validateKeys } from "./helpers.js";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import AES from "crypto-js/aes.js";
import aesutf8 from "crypto-js/enc-utf8.js";
import { DateTime } from "luxon";
import formidable from "formidable";
import sharp from "sharp";
import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();

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
    console.log("hello")
    const MEGABYTE = 1024 * 1024;
    let { data, files } : any = await new Promise(resolve => {
        formidable({ keepExtensions: true, multiples: true, maxFileSize: (500 * MEGABYTE) }).parse(req, (err: any, data: any, files: any) => {
            if (err) {
                if (err.httpCode === 413) {
                    res.status(400).send("Your images or audio recording are too big. If it's an image, remove it and try again. If it's an audio recording, you may need to make a smaller recording.");
                } else {
                    console.warn(err);
                    res.status(400).send("Something's wrong with your images. Please remove them and try again.");
                }
            }

            resolve({ data, files });
        });
    });

    if (res.headersSent) return;

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
        res.status(400).send(`Please keep journals below ${MAX_CHARS} characters. You can split up your journal into multiple entries if you need to.`);
        return;
    }

    // Average validation
    const acceptedAverages = ["below", "average", "above"];
    if (typeof data.average !== "string" || !acceptedAverages.includes(data.average)) {
        res.send(400);
        return;
    }

    /// Non-now journaling validation
    // Basic property validation
    data.editTimestamp = data.editTimestamp ? Number(data.editTimestamp) : null;
    if (data.editTimestamp) {
        if (typeof data.editTimestamp !== "number" || isNaN(data.editTimestamp) || data.editTimestamp !== parseInt(data.editTimestamp) || data.editTimestamp < 0) {
            res.send(400);
            return;
        }
    }

    if (data.editTimestamp && data.addFlag) {
        res.send(400);
        return;
    }

    // Set globalNow based on sent properties
    let globalNow = DateTime.utc();

    if (data.addFlag) {
        if (typeof data.addFlag !== "string") {
            res.send(400);
            return;
        }

        if (data.addFlag.startsWith("summary:")){
            const timestamp = data.addFlag.split("summary:")[1].split(" ")[0];
            if (!timestamp || isNaN(Date.parse(timestamp))) {
                res.send(400);
                return;
            }
            globalNow = DateTime.fromISO(data.addFlag.split("summary:")[1], {
                zone: data.timezone,
            });
        } else if (data.addFlag.contains("offlineSync:")) {
            let timestamp = data.addFlag.split("offlineSync:")[1];
            if (!timestamp || isNaN(Number(timestamp)) || Number(timestamp) < 0) {
                res.send(400);
                return;
            }
            globalNow = DateTime.fromMillis(Number(timestamp));
        }

        if (!globalNow.isValid) {
            res.send(400);
            return;
        }
    }

    if (data.editTimestamp) {
        globalNow = DateTime.fromMillis(data.editTimestamp);
    }

    // Final timezone validation
    if (typeof data.timezone !== "string" || !globalNow.setZone(data.timezone).isValid) {
        res.send(400);
        return;
    }

    // Song validation
    if (data.song) {
        if (typeof data.song !== "string" || !data.song.startsWith("spotify:track:") || data.song.length > 100) {
            res.send(400);
            return;
        }
    }

    let filePaths: string[] = [];
    let images = files["file"];
    // If user has screenshots:
    if (images) {
        // If there's only one, they'll be given as just an object,
        // so put them into an array
        if (!Array.isArray(images)) images = [images];
        // Validate file limit
        if (images.length > 3) {
            res.send(400);
            return;
        }

        let promises = [];
        for (const file of images) {
            // Convert file to WEBP (with compression), and then save
            // Promises array for parallel processing
            try {
                promises.push(
                    sharp(file.filepath)
                        .rotate()
                        .webp()
                        .toBuffer()
                        .then((buf: Buffer) => {
                            // Clean up temp file: https://firebase.google.com/docs/functions/tips#always_delete_temporary_files
                            fs.rmSync(file.filepath);

                            // Upload
                            const fileName = `${uuidv4()}.webp.enc`;
                            filePaths.push(fileName);
                            const data = AES.encrypt(`data:image/webp;base64,${buf.toString("base64")}`, encryptionKey).toString();
                            return getStorage().bucket().file(`user/${req.user!.user_id}/${fileName}`).save(data);
                        })
                );
            } catch (e: any) {
                console.log(e);
                res.status(400).send("Something's wrong with your images. Please remove them and try again.");
                return;
            }
        }

        // Wait for all uploads to complete
        try {
            await Promise.all(promises);
        } catch (e: any) {
            console.log(e);
            res.status(400).send("Something's wrong with your images. Please remove them and try again.");
            return;
        }
    }

    let logData: AnyMap = {};

    let promises = [];

    // Audio processing
    let audio = files["audio"] as formidable.File;
    let audioData = null;
    if (audio) {        
        if (Array.isArray(audio)) {
            res.send(400);
            return;
        }

        if (!audio.mimetype) {
            res.send(400);
            return;
        }

        if (audio.size === 0) {
            res.status(400).send("Your audio journal has no data. Please try submitting/recording again. If you continue to see this message, your device/browser may not support audio recording.");
            return;
        }

        const storagePath = "tmp/" + audio.newFilename;
        promises.push(getStorage().bucket().file(storagePath).save(fs.readFileSync(audio.filepath), { contentType: audio.mimetype ?? undefined }).then(() => {
            // Clean up temp file
            fs.rmSync(audio.filepath);
        }));
        audioData = {
            user: req.user!.user_id,
            log: globalNow.toMillis(),
            file: storagePath,
            encryptionKey: encryptionKey
        }
    }
    
    let setLastUpdated = true;
    if (!data.editTimestamp) {
        const userNow = globalNow.setZone(data.timezone);
        logData = {
            year: userNow.year,
            month: userNow.month,
            day: userNow.day,
            time: userNow.toFormat("h:mm a"),
            zone: userNow.zone.name,
            mood: data.mood,
            journal: data.journal,
            average: data.average,
            files: filePaths,
        };

        if (data.song) {
            logData.song = data.song;
        }

        if (audioData) {
            logData.journal = "Audio upload and transcription in progress! Check back in a minute.";
            logData.audio = "inprogress";
        }

        const lastUpdated = (
          await db.ref(`/${req.user!.user_id}/lastUpdated`).get()
        ).val();
        if (data.addFlag && data.addFlag.startsWith("summary:")) {
            logData.time = "12:00 PM";
            logData.zone = "local";
            logData.addFlag = "summary";
            logData.timeLogged = DateTime.utc().toMillis();

            if (lastUpdated && lastUpdated > globalNow.toMillis()) {
                setLastUpdated = false;
                promises.push(db.ref(`/${req.user!.user_id}/offline`).set(Math.random()));
            }
        }

        if (data.addFlag && data.addFlag.includes("offlineSync:")) {
          console.log("Adding offline sync flag");
          if (lastUpdated && lastUpdated > globalNow.toMillis()) {
            setLastUpdated = false;
          }
          promises.push(
            db.ref(`/${req.user!.user_id}/offline`).set(Math.random())
          );
        }

        // maybe use addFlag to determine if unsynced + update offline
    } else {
        logData = await (await db.ref(`/${req.user!.user_id}/logs/${data.editTimestamp}`).get()).val();
        if (!logData) {
            res.send(400);
            return;
        }

        logData = JSON.parse(AES.decrypt(logData.data, encryptionKey).toString(aesutf8));
        logData.mood = data.mood;
        logData.journal = data.journal;
        logData.average = data.average;
        promises.push(db.ref(`/${req.user!.user_id}/offline`).set(Math.random()));
    }
    

    const p1 = db.ref(`/${req.user!.user_id}/logs/${globalNow.toMillis()}`).set({
        data: AES.encrypt(JSON.stringify(logData), encryptionKey).toString()
    });

    const p2 = pubsub.topic("pubsub-trigger-cleanup").publishMessage({ data: Buffer.from(req.user!.user_id) });

    if (setLastUpdated) {
        promises.push(db.ref(`/${req.user!.user_id}/lastUpdated`).set(globalNow.toMillis()));
    }

    await Promise.all([p1, p2, ...promises]);
    if (audioData) {
        await pubsub.topic("pubsub-audio-processing").publishMessage({ json: audioData });
    }
    
    res.sendStatus(200);
}