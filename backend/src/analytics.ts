import { Request, Response } from "express";
import * as murmur from "murmurhash-js";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore"; 
import { randomUUID } from "crypto";
import { getDatabase } from "firebase-admin/database";
import { getClientIp } from "./helpers.js";

interface ConversionData {
    utm_source: string;
    utm_campaign: string;
    state: "visited" | "install_started" | "signed_up";
    timestamp: Timestamp;
    uuid?: string;
}

const addData = async (doc: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>, body: ConversionData) => {
    await doc.set({
        [randomUUID()]: {
            utm_source: body.utm_source,
            utm_campaign: body.utm_campaign,
            state: body.state,
            timestamp: FieldValue.serverTimestamp()
        }
    }, { merge: true });
};

export const beacon = async (req: Request, res: Response) => {
    const body = req.body;
    if (!body.fingerprint || typeof body.fingerprint !== "number") {
        res.send(400);
        return;
    }

    if (!body.state || typeof body.state !== "string" || !["visited", "install_started", "signed_up"].includes(body.state)) {
        res.send(400);
        return;
    }

    if (body.state === "signed_up" && (!body.uid || typeof body.uid !== "string")) {
        res.send(400);
        return;
    }

    if (!body.utm_source) body.utm_source = "unknown";
    if (!body.utm_campaign) body.utm_campaign = "unknown";

    if (typeof body.utm_source !== "string" || typeof body.utm_campaign !== "string") {
        res.send(403);
        return;
    }

    const fingerprint = String(murmur.murmur3(getClientIp(req) + body.fingerprint, 283794322));
    const fsdb = getFirestore();
    const doc = fsdb.collection(`conversions`).doc(fingerprint);

    if (body.state === "visited") {
        await addData(doc, body);
    } else if (body.state === "install_started") {
        const docGet = await doc.get();
        let updated = false;

        if (docGet.exists) {
            const objData = docGet.data()!;
            let data: ConversionData[] = [];
            for (let uuid of Object.keys(objData)) {
                data.push({ ...(objData[uuid] as ConversionData), uuid });
            }

            data = data.filter(d => d.state === "visited" && d.utm_source === body.utm_source && d.utm_campaign === body.utm_campaign);

            if (data.length > 0) {
                updated = true;
                data = data.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                await doc.update({
                    [`${data[0].uuid}.state`]: body.state,
                    [`${data[0].uuid}.timestamp`]: FieldValue.serverTimestamp(),
                });
            }
        }

        if (!updated) await addData(doc, body);
    } else if (body.state === "signed_up") {
        const docGet = await doc.get();
        if (docGet.exists) {
            const objData = docGet.data()!;
            let data: ConversionData[] = [];
            for (let uuid of Object.keys(objData)) {
                data.push({ ...(objData[uuid] as ConversionData), uuid });
            }

            data = data.filter(d => d.state !== "signed_up");
            if (data.length > 0) {
                data.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                let last = data[0];
                // If there is an install_started, use that instead of just last visited
                const install_started = data.filter(d => d.state === "install_started");
                if (install_started.length > 0) {
                    last = install_started[0];
                }

                await doc.update({
                    [`${last.uuid}.state`]: body.state,
                    [`${last.uuid}.uid`]: body.uid,
                    [`${last.uuid}.timestamp`]: FieldValue.serverTimestamp(),
                });

                const db = getDatabase();
                const info = (await db.ref(`${body.uid}/info`).get()).val();
                if (!(info?.utm_source && info?.utm_campaign)) {
                    await db.ref(`${body.uid}/info`).update({
                        utm_source: last.utm_source,
                        utm_campaign: last.utm_campaign,
                    });
                }
            }
        }
    }

    res.send(200);
};