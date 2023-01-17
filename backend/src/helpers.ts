import { Request, Response } from "express";
import { initializeApp } from "firebase-admin/app";
import { Database, getDatabase } from "firebase-admin/database";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";
import { DateTime } from "luxon";
import AES from "crypto-js/aes.js";
import aesutf8 from "crypto-js/enc-utf8.js";
import bcrypt from "bcryptjs";

const quotaApp = initializeApp({
    databaseURL: "https://getbaselineapp-quotas.firebaseio.com/"
}, "quota");
const quotaDb = getDatabase(quotaApp);

export interface UserRequest extends Request {
    user?: DecodedIdToken;
}

export interface AnyMap {
    [key: string]: any;
}

export const validateAuth = async (req: UserRequest, res: Response) => {
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
        const decodedIdToken = await getAuth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        return;
    } catch (error: any) {
        console.log(error.message);
        res.status(403).send("Unauthorized");
        return;
    }
};

export const checkQuota = async (req: UserRequest, res: Response) => {
    const user = req.user!.user_id;
    const now = DateTime.now();
    const minute = now.hour * 60 + now.minute;
    const ref = quotaDb.ref(`/${user}:${minute}`);
    const numVals = Object.keys((await (await ref.get()).val()) ?? {}).length;
    if (numVals > 60) {
        res.status(429).send("Rate limit, try again in a minute.");
        return false;
    }
    ref.push("q");
    return true;
}

export const validateKeys = async (keys_: string, db: Database, user_id: string) => {
    if (typeof keys_ !== "string") {
        return false;
    }

    let keys;
    try {
        keys = JSON.parse(keys_);
    } catch {
        return false;
    }

    // > 4 because additionalData attribute will
    // sometimes be stored in keys on old devices
    if (!keys || Object.keys(keys).length > 4) {
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