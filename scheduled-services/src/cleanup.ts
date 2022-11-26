import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const quotaApp = initializeApp({
    databaseURL: "https://getbaselineapp-quotas.firebaseio.com/"
}, "quota");

export const cleanUpQuotas = async () => {
    await getDatabase(quotaApp).ref("/").set({});
}

export const cleanUpAnonymous = async () => {
    let promises: Promise<any>[] = [];
    let usersToDelete: string[]  = [];
    const db = getDatabase();
    const auth = getAuth();
    const storage = getStorage();

    const listAllUsers = async (nextPageToken?: string) => {
        try {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);
            listUsersResult.users.forEach((userRecord: any) => {
                const userData = userRecord.toJSON() as UserRecord;
                if (userData.providerData.length === 0) {
                    // Anonymous account -- delete artifacts and get UID for deletion from Auth
                    promises.push(db.ref(`/${userData.uid}`).remove());
                    promises.push(storage.bucket().deleteFiles({ prefix: `user/${userData.uid}` }));
                    usersToDelete.push(userData.uid);
                }
            });

            // List next batch of users, if it exists.
            if (listUsersResult.pageToken) {
                await listAllUsers(listUsersResult.pageToken);
            }
        } catch (error) {
            console.log("Error listing users:", error);
        }
    };

    // Get users, and wait for user data deletion to finish
    await listAllUsers();
    await Promise.all(promises);

    // Auth deletion is rate-limited, so delete accounts at 8/second
    while (usersToDelete.length > 0) {
        let promises = [];
        for (let i = 0; i < 8 && usersToDelete.length !== 0; i++) {
            promises.push(auth.deleteUser(usersToDelete.pop()!));
        }

        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}