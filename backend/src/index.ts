import express from "express";
import { initializeApp } from "firebase-admin/app";
import cors from "cors";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { checkQuota, UserRequest, validateAuth } from "./helpers.js";
import { changePDPpassphrase, disablePDP, enablePDP } from "./pdp.js";
import { deleteAccount, getOrCreateKeys, sync } from "./accounts.js";
import { getImage, moodLog, survey } from "./main.js";
import { gapFund } from "./gap.js";
import { beacon } from "./analytics.js";

const app = express();
initializeApp({
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
    storageBucket: "getbaselineapp.appspot.com"
});

Sentry.init({
    dsn: "https://4fb379f6ae1a4e569ae826f066adf8ba@o4504179120472064.ingest.sentry.io/4504179121717248",
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
});

app.use(cors());
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(async (req: UserRequest, res, next) => {
    if (req.path.startsWith("/analytics/")) return next();
    
    await validateAuth(req, res);
    if (req.user && await checkQuota(req, res)) {
        Sentry.setUser({
            id: req.user.uid
        });
        next();
    }
});

app.use(express.json({
    type(req) {
        return req.headers["content-type"] === "application/json" || !req.headers["content-type"];
    }
}));

app.get("/", (_, res) => {
    res.status(200).send("baseline API up and running.");
});

// PDP
app.post("/pdp/enable", enablePDP);
app.post("/pdp/disable", disablePDP);
app.post("/pdp/change", changePDPpassphrase);

// Account Info & Management
app.post("/accounts/delete", deleteAccount);
app.post("/accounts/sync", sync);
app.post("/accounts/getOrCreateKeys", getOrCreateKeys);

// First-Party Anayltics
app.post("/analytics/beacon", beacon);

// Main Functions
app.post("/moodLog", moodLog);
app.post("/survey", survey);
app.post("/getImage", getImage);

app.post("/gap", gapFund);

app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});