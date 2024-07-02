const admin = require("firebase-admin");
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://getbaselineapp-default-rtdb.firebaseio.com/",
});

const message = {
    notification: {
        title: "Mental health is complex.",
        body: "Journaling is a great way to start figuring it out. Tap here to begin.",
    },
    token: "",
    android: {
        collapseKey: "standarduserretention",
        notification: {
            tag: "standarduserretention"
        }
    },
    apns: {
        headers: {
            "apns-collapse-id": "standarduserretention",
        },
    }
};

// send message
const messaging = admin.messaging();
messaging
    .send(message)
    .then((response) => {
        console.log("Successfully sent message:", response);
    })
    .catch((error) => {
        console.log("Error sending message:", error);
    });
