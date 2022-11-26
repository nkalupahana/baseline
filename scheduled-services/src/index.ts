import express from "express";
import { cleanUpAnonymous, cleanUpQuotas } from "./cleanup.js";
import { sendCleanUpMessage } from "./messaging.js";

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
    res.send(200);
});

app.post("/messaging/cleanup", async (_, res) => {
    await sendCleanUpMessage();
    res.send(200);
})

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