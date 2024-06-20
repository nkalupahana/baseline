import { Request, Response } from "express";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fs from "node:fs";

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
    const data = req.body.message.data;
    const body = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as ProcessAudioMessage;
    const id = uuidv4();
    const inputFilepath = `/tmp/${id}`;
    const outputFilepath = `/tmp/${id}.ogg`;

    await getStorage().bucket().file(body.file).download({ destination: inputFilepath });
    await convertToOgg(inputFilepath, outputFilepath, STARTING_BITRATE);

    const stats = fs.statSync(outputFilepath);
    if (stats.size >= MAX_FILE_SIZE) {
        let bitrate = Math.floor(STARTING_BITRATE / (stats.size / MAX_FILE_SIZE));
        while (fs.statSync(outputFilepath).size >= MAX_FILE_SIZE || bitrate < 8) {
            await convertToOgg(inputFilepath, outputFilepath, bitrate);
            bitrate -= 1; 
        }
    }

    let text = "Open to listen (unable to transcribe).";
    if (fs.statSync(outputFilepath).size < MAX_FILE_SIZE) {
        const form = new FormData();
        form.append("file", new Blob([fs.readFileSync(outputFilepath)]));
        form.append("model", "whisper-1");
        form.append("prompt", "This is a journal entry on the journaling app baseline. Use correct punctuation.");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: form
        });
        
        if (response.ok) {
            const json = await response.json();
            if (json.text) {
                text = json.text;
            } else {
                console.error(json);
            }
        } else {
            console.error(new Error("OPENAI TRANSCRIPTION FAILED"));
            console.error(await response.text());
        }
    }

    console.log(text);

    //await getStorage().bucket().file(`tmp/${id}-upload.ogg`).save(fs.readFileSync(`/tmp/${id}-upload.ogg`), { contentType: "audio/ogg;codecs=opus" });
    
    res.sendStatus(200);
};