import * as functions from "firebase-functions";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
export interface Request extends functions.https.Request {
    user?: DecodedIdToken;
}

const preflight = async (req: Request, res: functions.Response<any>): Promise<boolean> => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization");

    // CORS Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return false;
    }

    return true;
};

const reject = (res: functions.Response<any>) => {
    res.status(400).send("Too old! Please update baseline in your App Store to perform this action.");
};

export const moodLog = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const getImage = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const survey = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const gapFund = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const getOrCreateKeys = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;
    
    return reject(res);
});

export const enablePDP = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;
    
    return reject(res);
});

export const changePDPpassphrase = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;
    
    return reject(res);
});

export const removePDP = functions.https.onRequest(async (req: Request, res) => { 
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const deleteAccount = functions.https.onRequest(async (req: Request, res) => {
    if (!(await preflight(req, res))) return;

    return reject(res);
});

export const syncUserInfo = functions.https.onRequest(async (req: Request, res) => {
    return reject(res);
});
