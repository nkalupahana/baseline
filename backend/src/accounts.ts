import { UserRequest } from "./helpers.js";
import { Response } from "express";
import bcrypt from "bcryptjs";
import _ from "lodash";
import AES from "crypto-js/aes.js";
import aesutf8 from "crypto-js/enc-utf8.js";
import random from "crypto-random-string";
import { getDatabase, ServerValue } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

const TOKENS: any = {
    web: "d43e4a0f0eac5ab776190238b97c415e847d045760d3608d75994379dd02a565",
    android: "07441aa58144eecb74f973795899f223e06a8306d109cfd496aa59372d5a200f",
    ios: "2a0a11d8b842c93e6e14c7a0e00cd7d9d2afac12917281a9f8ae845c17d4fc4a"
};

const CLOUDKIT: any = {
    ENV: "production",
    ID: "iCloud.baseline.getbaseline.app",
    BASE: "https://api.apple-cloudkit.com"
};

export const getOrCreateKeys = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (typeof body.credential !== "object" || typeof body.credential.providerId !== "string" || typeof body.credential.accessToken !== "string") {
        res.send(400);
        return;
    }

    if (!["google.com", "apple.com", "anonymous"].includes(body.credential.providerId)) {
        res.send(400);
        return;
    }

    if (typeof body.platform !== "string" || !["ios", "android", "web"].includes(body.platform)) {
        res.send(400);
        return;
    }
    
    const db = getDatabase();
    const pdp = await (await db.ref(`/${req.user!.user_id}/pdp`).get()).val();
    if (pdp && typeof pdp === "object") {
        if (typeof body.passphrase !== "string" || !bcrypt.compareSync(body.passphrase, pdp.passphraseHash)) {
            res.status(401).send("Your passphrase is incorrect.");
            return;
        }
    }

    const encryptionData = await (await db.ref(`/${req.user!.user_id}/encryption`).get()).val();

    if (!process.env.KEY_ENCRYPTION_KEY) {
        res.send(500);
        return;
    }

    if (encryptionData) {
        let keys: any = {};
        if (body.credential.providerId === "google.com") {
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encryptionData.id}?fields=properties`, {
                headers: {
                    "Authorization": `Bearer ${body.credential.accessToken}`,
                }
            });

            if (!response) {
                res.send(400);
                return;
            }

            const respData = await response.json();
            if ("error" in respData || !("properties" in respData)) {
                const message = respData.error?.message?.toLowerCase();
                if (message && message.includes("insufficient") && message.includes("scopes")) {
                    res.send(428);
                } else {
                    res.send(400);
                }
                return;
            }

            keys = respData["properties"];
            keys["encryptedKeyVisible"] = AES.decrypt(keys["encryptedKey"], process.env.KEY_ENCRYPTION_KEY).toString(aesutf8);
        } else if (body.credential.providerId === "apple.com") {
            const url = `${CLOUDKIT.BASE}/database/1/${CLOUDKIT.ID}/${CLOUDKIT.ENV}/private/records/lookup?ckAPIToken=${TOKENS[body.platform]}&ckWebAuthToken=${body.credential.accessToken}`;
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify({
                    "records": {
                        "recordName": "Keys",
                        "desiredFields": ["encryptedKey", "visibleKey"]
                    }
                })
            });
            let respData = await response.json();
            if ("serverErrorCode" in respData || !("records" in respData) || "serverErrorCode" in respData["records"][0]) {
                console.log("KEY GET FAIL");
                console.log(JSON.stringify(respData));
                res.send(406);
                return;
            }

            respData = respData["records"][0]["fields"];
            keys = {
                encryptedKey: respData["encryptedKey"]["value"],
                visibleKey: respData["visibleKey"]["value"],
                encryptedKeyVisible: AES.decrypt(respData["encryptedKey"]["value"], process.env.KEY_ENCRYPTION_KEY).toString(aesutf8)
            };
        } else if (body.credential.providerId === "anonymous") {
            // Anonymous users shouldn't be signing in again!
            res.send(400);
            return;
        }

        const dataPromises = [
            db.ref(`${req.user!.user_id}/offline`).get(),
            db.ref(`${req.user!.user_id}/lastUpdated`).get(),
            db.ref(`${req.user!.user_id}/onboarding`).get()
        ];
    
        await Promise.all(dataPromises);
        let data = [];
        for (let promise of dataPromises) {
            data.push((await promise).val());
        }

        res.send({
            ...keys,
            additionalData: {
                offline: data[0],
                onboarded: ((!!data[1]) || data[2]?.onboarded),
                beginner: data[2]?.beginner ?? 0,
                introQuestions: !!(data[2]?.questions)
            }
        });
        return;
    }

    const visibleKey = random({length: 32, type: "url-safe"});
    const encryptedKeyVisible = random({length: 32, type: "url-safe"});
    const encryptedKey = AES.encrypt(encryptedKeyVisible, process.env.KEY_ENCRYPTION_KEY).toString();
    let id: string = "";

    if (body.credential.providerId === "google.com") {
        const response = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            body: JSON.stringify({
                "parents": ["appDataFolder"],
                "name": "keys",
                "properties": {
                    visibleKey,
                    encryptedKey
                }
            }),
            headers: {
                "Authorization": `Bearer ${body.credential.accessToken}`,
                "Content-Type": "application/json"
            }
        });

        const respData = await response.json();

        if ("error" in respData || !("id" in respData)) {
            const message = respData.error?.message?.toLowerCase();
            if (message && message.includes("insufficient") && message.includes("scopes")) {
                res.send(428);
            } else {
                res.send(400);
            }
            return;
        }

        id = respData["id"];
    } else if (body.credential.providerId === "apple.com") {
        const url = `${CLOUDKIT.BASE}/database/1/${CLOUDKIT.ID}/${CLOUDKIT.ENV}/private/records/modify?ckAPIToken=${TOKENS[body.platform]}&ckWebAuthToken=${body.credential.accessToken}`;
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                operations: [{
                    operationType: "forceReplace",
                    record: {
                        recordType: "Keys",
                        recordName: "Keys",
                        fields: {
                            visibleKey: {
                                value: visibleKey,
                                recordType: "STRING"
                            },
                            encryptedKey: {
                                value: encryptedKey,
                                recordType: "STRING"
                            }
                        }
                    }
                }]
            })
        });

        const respData = await response.json();
        if (("serverErrorCode" in respData) || ("serverErrorCode" in respData["records"][0])) {
            console.log("KEY SET FAIL");
            console.log(JSON.stringify(respData));
            res.send(406);
            return;
        }

        id = "Keys";
    } else if (body.credential.providerId === "anonymous") {
        // No key storage for anonymous users -- their data is lost after they sign out
        id = "anonymous";
    }

    await db.ref(`${req.user!.user_id}/encryption`).set({
        encryptedKeyHash: bcrypt.hashSync(encryptedKey, bcrypt.genSaltSync(10)),
        id
    });

    res.send({
        visibleKey,
        encryptedKey,
        encryptedKeyVisible,
        additionalData: {
            offline: null,
            onboarded: false
        }
    });
};

export const deleteAccount = async (req: UserRequest, res: Response) => {
    // Delete database data
    await getDatabase().ref(`${req.user!.user_id}`).remove();

    // Delete storage data
    await getStorage().bucket().deleteFiles({
        prefix: `user/${req.user!.user_id}/`
    });

    // Delete user in auth
    await getAuth().deleteUser(req.user!.user_id);

    res.send(200);
};

export const sync = async (req: UserRequest, res: Response) => {
    const body = req.body;
    let update: any = {
        fcm: {},
        platforms: {}
    };

    // Time zone offset
    const checkOffset = () => {
        if ("offset" in body) {
            if (typeof body.offset !== "number" || body.offset < -1000 || body.offset > 1000) return;
            update.offset = body.offset;
        }
    }
    checkOffset();

    const checkPlatform = () => {
        if ("platform" in body) {
            if (typeof body.platform !== "string" || !["ios", "android", "web"].includes(body.platform)) return;
            update["platforms"][body.platform] = true;
        }
    }
    checkPlatform();

    // FCM data
    const checkToken = () => {
        if ("deviceId" in body && "fcmToken" in body) {
            if (typeof body.deviceId !== "string" || !body.deviceId || body.deviceId.length > 100) return;
            if (typeof body.fcmToken !== "string" || !body.fcmToken || body.fcmToken.length > 1000) return;
    
            update["fcm"][body["deviceId"]] = {
                token: body["fcmToken"],
                lastSync: ServerValue.TIMESTAMP
            };
        }
    };
    checkToken();

    // Broad geolocation
    const geo = await (await fetch(`http://ip-api.com/json/${req.get("X-Forwarded-For")}`)).json();
    if (geo.status === "success") {
        update["country"] = geo["country"];
        update["region"] = geo["regionName"];
    }

    const ref = getDatabase().ref(`${req.user!.user_id}/info`);
    const oldInfo = await (await ref.get()).val() ?? {};
    await ref.set(_.merge(oldInfo, update));
    res.send(200);
};