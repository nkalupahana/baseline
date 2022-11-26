import { getMessaging } from "firebase-admin/messaging";

export const sendCleanUpMessage = async () => {
    await getMessaging().send({
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
}