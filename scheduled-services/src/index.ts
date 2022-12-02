import express from "express";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { loadBasicBIData } from "./bi.js";
import { cleanUpAnonymous, cleanUpQuotas } from "./cleanup.js";
import { cleanUpTokens, logReminder, sendCleanUpMessage } from "./messaging.js";

initializeApp({
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
    storageBucket: "getbaselineapp.appspot.com"
});

const app = express();
app.use(express.json());

interface AnyMap {
    [key: string]: any;
}

export const makeInternalRequest = (req: express.Request, path: string, data?: AnyMap) => {
    fetch(`https://scheduled-services-lg27dbkpuq-uc.a.run.app/${path}`, {
        method: "POST",
        headers: {
            "authorization": req.headers.authorization!,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data ?? {})
    })
};

app.post("/", (_, res) => {
    res.send(200);
});

app.post("/bi", async (req, res) => {
    const db = (await getDatabase().ref("/").get()).val();
    await loadBasicBIData(db);

    // Now that data's been loaded,
    // kick off requests based on that
    makeInternalRequest(req, "messaging/logReminder");
    res.send(200);
});

app.post("/messaging/logReminder", logReminder);

app.post("/messaging/cleanup", async (_, res) => {
    await sendCleanUpMessage();
    res.send(200);
});

app.post("/messaging/cleanUpTokens", cleanUpTokens);

app.post("/cleanup/anonymous", async (_, res) => {
    await cleanUpAnonymous();
    res.send(200);
});

app.post("/cleanup/quotas", async (_, res) => {
    await cleanUpQuotas();
    res.send(200);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});