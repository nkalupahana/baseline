import express from "express";

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
    console.log(req.body);
    res.send(200);
});

app.post("/path2", (req, res) => {
    console.log(req.body);
    res.send(200);
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log("Listening on port", port);
});