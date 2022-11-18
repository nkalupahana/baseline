import express from "express";
import * as admin from "firebase-admin";
import cors from "cors";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { checkQuota, UserRequest, validateAuth } from "./helpers";
import { changePDPpassphrase, disablePDP, enablePDP } from "./pdp";
import { deleteAccount, getOrCreateKeys, sync } from "./accounts";

const app = express();
admin.initializeApp();

Sentry.init({
    dsn: "https://4fb379f6ae1a4e569ae826f066adf8ba@o4504179120472064.ingest.sentry.io/4504179121717248",
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
    ],
    // capture this % of traces
    tracesSampleRate: 1.0,
});

app.use(cors());
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(async (req: UserRequest, res, next) => {
    await validateAuth(req, res);
    if (req.user && await checkQuota(req, res)) {
        next();
    }
});
app.use(express.json());

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

app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});