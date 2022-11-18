import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { DateTime } from "luxon";

const quotaApp = admin.initializeApp({
    databaseURL: "https://getbaselineapp-quotas.firebaseio.com/"
}, "quota");
const quotaDb = admin.database(quotaApp);

export interface UserRequest extends Request {
    user?: DecodedIdToken;
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
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        return;
    } catch (error) {
        console.log(error);
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