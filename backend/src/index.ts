import express from "express";
const app = express();

app.get("/", (_, res) => {
    res.status(200).send("Hello World!");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});