import { UserRequest } from "./helpers";
import { Response } from "express";
import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";

export const changePDPpassphrase = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (typeof body.oldPassphrase !== "string" || body.oldPassphrase.length < 6) {
        res.send(400);
        return;
    }

    if (typeof body.newPassphrase !== "string" || body.newPassphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    const oldHash = await (await db.ref(`${req.user!.user_id}/pdp/passphraseHash`).get()).val();
    if (!oldHash || !bcrypt.compareSync(body.oldPassphrase, oldHash)) {
        res.send(400);
        return;
    }

    await db.ref(`${req.user!.user_id}/pdp`).update({
        passphraseHash: bcrypt.hashSync(body.newPassphrase),
        passphraseUpdate: Math.random()
    });

    res.send(200);
};

export const enablePDP = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (typeof body.passphrase !== "string" || body.passphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    if (await (await db.ref(`${req.user!.user_id}/pdp`).get()).val()) {
        res.send(400);
        return;
    }

    await db.ref(`${req.user!.user_id}/pdp`).set({
        passphraseHash: bcrypt.hashSync(body.passphrase),
        passphraseUpdate: Math.random(),
        method: "upfront"
    });

    res.send(200);
};

export const disablePDP = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (typeof body.passphrase !== "string" || body.passphrase.length < 6) {
        res.send(400);
        return;
    }

    const db = admin.database();
    const hash = await (await db.ref(`${req.user!.user_id}/pdp/passphraseHash`).get()).val();
    if (!hash || !bcrypt.compareSync(body.passphrase, hash)) {
        res.send(400);
        return;
    }
    
    await db.ref(`${req.user!.user_id}/pdp`).remove();
    res.send(200);
};