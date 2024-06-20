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

export const processAudio = async (req: Request, res: Response) => {
    const data = req.body.message.data;
    const body = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as ProcessAudioMessage;
    const id = uuidv4();
    const inputFilepath = `/tmp/${id}`;
    const outputFilepath = `/tmp/${id}.ogg`;

    await getStorage().bucket().file(body.file).download({ destination: inputFilepath });
    await new Promise((res, rej) => {
        ffmpeg(inputFilepath)
            .noVideo()
            .outputOptions('-map_metadata', '-1')
            .audioChannels(1)
            .audioCodec('libopus')
            .audioBitrate('90k')
            .save(outputFilepath)
            .on('end', res)
            .on('error', rej);
    });

    await getStorage().bucket().file(`tmp/${id}.ogg`).save(fs.readFileSync(outputFilepath), { contentType: "audio/ogg;codecs=opus" });
    
    res.sendStatus(200);
};