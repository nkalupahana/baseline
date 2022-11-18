import express from "express";
import * as admin from "firebase-admin";
import cors from "cors";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

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

app.get("/", (_, res) => {
    res.status(200).send("baseline API up and running.");
});

app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});