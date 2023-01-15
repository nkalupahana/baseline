import { Request, Response } from "express";
import * as murmur from "murmurhash-js";
import { getDatabase } from "firebase-admin/database";
import { getFirestore, FieldValue } from "firebase-admin/firestore"; 
import { AnyMap } from "./helpers.js";

export const beacon = async (req: Request, res: Response) => {
    const body = req.body;
    console.log(body);
    if (!body.fingerprint || typeof body.fingerprint !== "number") {
        res.send(400);
        return;
    }

    if (!body.state || typeof body.state !== "string" || !["visited", "install_started", "signed_up"].includes(body.state)) {
        res.send(401);
        return;
    }

    if (body.state === "signed_up" && (!body.uid || typeof body.uid !== "string")) {
        res.send(402);
        return;
    }

    if (!body.utm_source) body.utm_source = "unknown";
    if (!body.utm_campaign) body.utm_campaign = "unknown";

    if (typeof body.utm_source !== "string" || typeof body.utm_campaign !== "string") {
        res.send(403);
        return;
    }

    const fingerprint = String(murmur.murmur3(req.get("X-Forwarded-For") + body.fingerprint, 283794322));
    const fsdb = getFirestore();
    const col = fsdb.collection(fingerprint);

    if (body.state === "visited") {
        // push data to collection
        await col.add({
            utm_source: body.utm_source,
            utm_campaign: body.utm_campaign,
            state: body.state,
            timestamp: FieldValue.serverTimestamp()
        });
    } else if (body.state === "install_started") {
        const docs = await col
            .orderBy("timestamp", "desc")
            .where("state", "==", "visited")
            .limit(1)
            .get();

        if (docs.docs.length > 0) {
            await docs.docs[0].ref.update({
                state: "install_started",
                timestamp: FieldValue.serverTimestamp(),
            });
        } else {
            await col.add({
                utm_source: body.utm_source,
                utm_campaign: body.utm_campaign,
                state: body.state,
                timestamp: FieldValue.serverTimestamp(),
            });
        }
    } else if (body.state === "signed_up") {
        const docs = await col
            .orderBy("timestamp", "desc")
            .where("state", "!=", "signed_up")
            .get();

        if (docs.docs.length > 0) {
            const data: AnyMap[] = docs.docs.map(doc => {
                return { ...(doc.data() as AnyMap), ref: doc.ref}
            });
            
            let last = data.at(-1);
            const install_started = data.filter(d => d.state === "install_started");
            if (install_started.length > 0) {
                last = install_started.at(-1)!;
            }

            await last!.ref.update({
                state: body.state,
                uid: body.uid,
                timestamp: FieldValue.serverTimestamp(),
            });

            // set data in firebase realtime database
            const db = getDatabase();
            await db.ref(`${body.uid}/info`).update({
                utm_source: last!.utm_source,
                utm_campaign: last!.utm_campaign,
            });
        }
    }

    res.send(200);
}