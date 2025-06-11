import { UserRequest, validateKeys } from "./helpers.js";
import { Response } from "express";
import AES from "crypto-js/aes.js";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import aesutf8 from "crypto-js/enc-utf8.js";

const getFile = async (req: UserRequest, res: Response) => {
    const db = getDatabase();

    const body = req.body;
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);
    if (!encryptionKey) {
        res.send(400);
        return;
    }

    const filename = body.filename;
    // Max length: 32-char UUID.extn.enc
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

    return { file, filename, encryptionKey };
};

export const getImage = async (req: UserRequest, res: Response) => {
    const result = await getFile(req, res);
    if (!result) return;

    const { file, filename, encryptionKey } = result;
    
    if (filename.endsWith(".enc")) {
        res.send(AES.decrypt(file[0].toString("utf8"), encryptionKey).toString(aesutf8));
    } else {
        res.send(`data:image/webp;base64,${file[0].toString("base64")}`);
    }
}

export const getAudio = async (req: UserRequest, res: Response) => {
    const result = await getFile(req, res);
    if (!result) return;

    const { file, encryptionKey } = result;

    res.setHeader("Content-Type", "audio/mp3");
    res.send(Buffer.from(AES.decrypt(file[0].toString("utf8"), encryptionKey).toString(aesutf8), "binary"));
}