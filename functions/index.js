const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const validateAuth = async (req, res) => {
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

exports.moodLog = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', "*");
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Authorization');

    // Preflight? Stop here.
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    await validateAuth(req, res);
    if (!req.user) return;
    const data = JSON.parse(req.body);

    // Mood validation
    if (typeof data.mood !== "number" || data.mood < -5 || data.mood > 5 || data.mood !== parseInt(data.mood)) {
        res.send(400);
        return;
    }

    // Journal validation
    const MAX_CHARS = 10000;
    if (typeof data.journal !== "string" || data.journal.length > MAX_CHARS) {
        res.status(400).send(`Please keep journals below ${MAX_CHARS} characters.`);
        return;
    }

    // Average validation
    const acceptedAverages = ["below", "average", "above"];
    if (typeof data.average !== "string" || !acceptedAverages.includes(data.average)) {
        res.send(400);
        return;
    }

    await admin.database().ref(`/${req.user.user_id}/logs`).push({
        timestamp: Date.now(),
        mood: data.mood,
        journal: data.journal,
        average: data.average
    });
    
    res.send(200);
});
