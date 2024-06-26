import { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs";
import AES from "crypto-js/aes.js";
import { getDatabase } from "firebase-admin/database";
import aesutf8 from "crypto-js/enc-utf8.js";

interface ProcessAudioMessage {
    user: string;
    log: number;
    file: string;
    encryptionKey: string;
}

const MAX_FILE_SIZE = 26_214_400;
const STARTING_BITRATE = 96;

const convertToOgg = (input: string, output: string, bitrate: number) => {
    console.log("Convert at bitrate " + bitrate);
    return new Promise((res, rej) => {
        ffmpeg(input)
            .noVideo()
            .outputOptions('-map_metadata', '-1')
            .audioChannels(1)
            .audioCodec('libopus')
            .audioBitrate(`${bitrate}k`)
            .save(output)
            .on('end', res)
            .on('error', rej);
    });
}

export const processAudio = async (req: Request, res: Response) => {
    // Get data
    const data = req.body.message.data;
    const body = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as ProcessAudioMessage;
    const id = uuidv4();
    const inputFilepath = `/tmp/${id}`;
    const outputFilepath = `/tmp/${id}.ogg`;

    // Get log
    const db = getDatabase();
    const ref = db.ref(`/${body.user}/logs/${body.log}`);
    let logData = await (await ref.get()).val();
    logData = JSON.parse(AES.decrypt(logData.data, body.encryptionKey).toString(aesutf8));

    // Already processed? Skip.
    if (logData.audio !== "inprogress") {
        res.sendStatus(204);
        return;
    }

    await getStorage().bucket().file(body.file).download({ destination: inputFilepath });

    // Convert to starting bitrate ogg
    await convertToOgg(inputFilepath, outputFilepath, STARTING_BITRATE);

    // If too big, calculate new bitrate and get to acceptable size
    const stats = fs.statSync(outputFilepath);
    if (stats.size >= MAX_FILE_SIZE) {
        let bitrate = Math.floor(STARTING_BITRATE / (stats.size / MAX_FILE_SIZE));
        while (fs.statSync(outputFilepath).size >= MAX_FILE_SIZE || bitrate < 8) {
            await convertToOgg(inputFilepath, outputFilepath, bitrate);
            bitrate -= 1; 
        }
    }

    // Transcribe audio
    let text = "Open to listen (unable to transcribe).";
    if (fs.statSync(outputFilepath).size < MAX_FILE_SIZE) {
        const form = new FormData();
        form.append("file", new Blob([fs.readFileSync(outputFilepath)], { type: "audio/ogg" }));
        form.append("model", "whisper-1");

        let retryCount = 5;

        let response;
        while (retryCount > 0) {
            response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: form
            });
            
            if (!response.ok) {
                console.log("OPENAI RETRY");
                retryCount--;
                await new Promise(res => setTimeout(res, 10000));
            } else {
                // Exit loop
                retryCount = 0;
            }
        }

        if (response && response.ok) {
            const json = await response.json();
            if (typeof json.text === "string") {
                if (json.text.trim() === "") {
                    // Empty transcription; add filler text
                    text = "Open to listen (no transcription).";
                } else {
                    text = json.text;
                }
            } else {
                console.error(new Error("OPENAI TRANSCRIPTION FAILED - 1"));
                console.error(json);
            }
        } else if (response) {
            console.error(new Error("OPENAI TRANSCRIPTION FAILED - 2"));
            console.error(await response.text());
        } else {
            console.error(new Error("OPENAI TRANSCRIPTION FAILED - 3"));
        }
    }

    // Get MP3 for upload
    await new Promise((res, rej) => {
        ffmpeg(inputFilepath)
            .noVideo()
            .outputOptions('-map_metadata', '-1')
            .audioChannels(1)
            .audioBitrate(`96k`)
            .save(`/tmp/${id}-upload.mp3`)
            .on('end', res)
            .on('error', rej);
    });

    // Encrypt and upload
    const mp3 = fs.readFileSync(`/tmp/${id}-upload.mp3`);
    const mp3Encrypted = AES.encrypt(mp3.toString("binary"), body.encryptionKey).toString();
    const encFilename = `${id}.mp3.enc`;
    await getStorage().bucket().file(`user/${body.user}/${encFilename}`).save(mp3Encrypted);

    // Update log
    logData.audio = encFilename;
    logData.journal = text;

    await ref.set({
        data: AES.encrypt(JSON.stringify(logData), body.encryptionKey).toString()
    });
    await db.ref(`/${body.user}/offline`).set(Math.random());
    
    res.sendStatus(200);
};