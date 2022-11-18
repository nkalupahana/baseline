import * as admin from "firebase-admin";
import { UserRequest } from "./helpers";
import { Response } from "express";
import _ from "lodash";

export const deleteAccount = async (req: UserRequest, res: Response) => {
    // Delete database data
    await admin.database().ref(`${req.user!.user_id}`).remove();

    // Delete storage data
    await admin.storage().bucket().deleteFiles({
        prefix: `user/${req.user!.user_id}/`
    });

    // Delete user in auth
    await admin.auth().deleteUser(req.user!.user_id);

    res.send(200);
};

export const sync = async (req: UserRequest, res: Response) => {
    const body = req.body;
    let update: any = {
        fcm: {}
    };

    // Time zone offset
    const checkOffset = () => {
        if ("offset" in body) {
            if (typeof body.offset !== "number" || body.offset < -1000 || body.offset > 1000) return;
            update.offset = body.offset;
        }
    }
    checkOffset();

    // FCM data
    const checkToken = () => {
        if ("deviceId" in body && "fcmToken" in body) {
            if (typeof body.deviceId !== "string" || !body.deviceId || body.deviceId.length > 100) return;
            if (typeof body.fcmToken !== "string" || !body.fcmToken || body.fcmToken.length > 1000) return;
    
            update["fcm"][body["deviceId"]] = {
                token: body["fcmToken"],
                lastSync: admin.database.ServerValue.TIMESTAMP
            };
        }
    };
    checkToken();
    
    // Referrer for app install
    const checkRefer = () => {
        if ("utm_source" in body && "utm_campaign" in body) {
            if (typeof body.utm_source !== "string" || !body.utm_source || body.utm_source.length > 100) return;
            if (typeof body.utm_campaign !== "string" || !body.utm_campaign || body.utm_campaign.length > 100) return;
    
            update["utm_source"] = body["utm_source"];
            update["utm_campaign"] = body["utm_campaign"];
        }
    }
    checkRefer();

    // Broad geolocation
    const geo = await (await fetch(`http://ip-api.com/json/${req.get("X-Forwarded-For")}`)).json();
    if (geo.status === "success") {
        update["country"] = geo["country"];
        update["region"] = geo["regionName"];
    }

    const ref = admin.database().ref(`${req.user!.user_id}/info`);
    const oldInfo = await (await ref.get()).val() ?? {};
    await ref.set(_.merge(oldInfo, update));
    res.send(200);
};

export const reportForwards = async (req: UserRequest, res: Response) => {
    console.log(req.get("X-Forwarded-For"));
    res.send(200);
};