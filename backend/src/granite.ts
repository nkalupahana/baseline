import { UserRequest } from "./helpers.js";
import { Response } from "express";
import { getDatabase } from "firebase-admin/database";

export const graniteLink = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (body.flow === "code") {
        if (typeof body.code !== "string" || typeof body.code_verifier !== "string" || typeof body.redirect_uri !== "string") {
            res.send(400);
            return;
        }

        const form = new URLSearchParams();
        form.set("code", body.code);
        form.set("redirect_uri", body.redirect_uri);
        form.set("grant_type", "authorization_code");
        form.set("client_id", "J2TW2CuBnWMoiBSp");
        form.set("code_verifier", body.code_verifier);

        const access = await (await fetch("https://api.graniteaccess.io/oidc/token", {
            method: "POST",
            body: form,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })).json();

        if (access.error_description) {
            res.status(400).send(access.error_description);
            return;
        }

        body.flow = "token";
        body.access_token = access.access_token;
        body.id_token = access.id_token;
    }

    if (body.flow !== "token") {
        res.send(400);
        return;
    }

    if (typeof body.access_token !== "string" || typeof body.id_token !== "string") {
        res.send(400);
        return;
    }

    const mountaineer = await (await fetch("https://api.graniteaccess.io/client/has?address=0x8c01F90d54aF84394AF14e673b13802a714D72e8", {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${body.access_token}`
        }
    })).json();

    console.log(mountaineer);

    await getDatabase().ref(`${req.user!.user_id}/partners/granite`).set({
        id_token: body.id_token,
        access_token: body.access_token,
        hasMountaineer: mountaineer.holdsToken ?? false
    });

    res.send(200);
};