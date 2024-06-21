import { UserRequest, validateKeys } from "./helpers.js";
import { Response } from "express";
import AES from "crypto-js/aes.js";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import aesutf8 from "crypto-js/enc-utf8.js";

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

export const getAudio = async (req: UserRequest, res: Response) => {
    const db = getDatabase();

    const body = req.body;
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);
    if (!encryptionKey) {
        res.send(400);
        return;
    }

    const filename = body.filename;
    // Max length: 32-char UUID.mp3.enc
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

    res.setHeader("Content-Type", "audio/mp3");
    res.send(Buffer.from(AES.decrypt(file[0].toString("utf8"), encryptionKey).toString(), "base64"));
}