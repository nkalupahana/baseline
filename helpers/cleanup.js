const admin = require("firebase-admin");
admin.initializeApp();
admin.messaging().send({
    topic: "all",
    apns: {
        payload: {
            aps: {
                contentAvailable: true,
            }
        },
    },
    data: {
        cleanUp: "true"
    }
});