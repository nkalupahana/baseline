import { UserRequest } from "./helpers.js";
import { Response } from "express";
import { getDatabase } from "firebase-admin/database";

export const graniteLink = async (req: UserRequest, res: Response) => {
    const body = req.body;
    if (typeof body.code !== "string" || typeof body.redirect_uri !== "string") {
        res.send(400);
        return;
    }

    const access = await (await fetch("https://granite-labs.herokuapp.com/api/oauth/access_token", {
        method: "POST",
        body: JSON.stringify({
            code: body.code,
            redirect_uri: body.redirect_uri,
            grant_type: "authorization_code"
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })).json();
    
    if (!access.access_token) {
        res.status(400).send(access.message ?? "Something went wrong, please try again.");
        return;
    }

    const mountaineer = await (await fetch("https://granite-labs.herokuapp.com/api/client/has", {
        method: "POST",
        body: JSON.stringify({
            token: body.code,
            contractAddress: "0x8c01F90d54aF84394AF14e673b13802a714D72e8"
        }),
        headers: {
            "Content-Type": "application/json"
        }
    })).json();

    await getDatabase().ref(`${req.user!.user_id}/partners/granite`).set({
        access_token: access.access_token,
        hasMountaineer: mountaineer.has ?? false
    });

    res.send(200);
};