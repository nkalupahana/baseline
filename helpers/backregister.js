const admin = require("firebase-admin");
const fs = require("fs");
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
});

const userIds = fs.readFileSync("FILE").toString().split("\n");

let updates = {};
for (let userId of userIds) {
    updates[`/${userId}/info/utm_source`] = "SOURCE";
    updates[`/${userId}/info/utm_campaign`] = "CAMPAIGN";
}

(async () => {
    await admin.database().ref().update(updates)
    console.log("Done")
})();
