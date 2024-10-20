import express from "express";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { loadBasicBIData } from "./bi.js";
import { cleanUpAnonymous, cleanUpQuotas } from "./cleanup.js";
import { cleanUpTokens, logReminder, removeUserNotifications, sendCleanUpMessage } from "./messaging.js";
import { AnyMap } from "./helpers.js";
import * as Sentry from "@sentry/node";
import { audioDeadLetter, processAudio } from "./audio.js";

initializeApp({
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
    storageBucket: "getbaselineapp.appspot.com"
});

const app = express();

Sentry.init({
    dsn: "https://6e656f8deb434639a0bc75e5093b6f3c@o4504179120472064.ingest.sentry.io/4504348672196608",
    integrations: [
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
    ],
    tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());

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

app.post("/messaging/removeUserNotifications", removeUserNotifications);

app.post("/messaging/cleanUpTokens", cleanUpTokens);

app.post("/audio/process", processAudio);
app.post("/audio/dl", audioDeadLetter);

app.post("/cleanup/anonymous", async (_, res) => {
    await cleanUpAnonymous();
    res.send(200);
});

app.post("/cleanup/quotas", async (_, res) => {
    await cleanUpQuotas();
    res.send(200);
});

app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});