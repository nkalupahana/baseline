import { UserRequest } from "./helpers.js";
import { Response } from "express";

let accessToken: string | undefined = undefined;
const SPOTIFY_CLIENT_ID = "ccbd296481154de5b3cebf7f40386911";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export const search = async (req: UserRequest, res: Response) => {
    const body = req.body;
    const query = body.query;
    if (typeof query !== "string" || query.trim() === "") {
        res.status(400).send("Missing query!");
        return;
    }

    if (!accessToken) await requestAccessToken();
    if (!accessToken) {
        res.status(500).send("Error connecting to Spotify, try again in a minute.");
        return;
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=20`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )

    if (response.status === 429) {
        res.status(429).send("Rate limit from Spotify, try again in a minute.");
        return;
    }

    if (response.status === 401) {
        accessToken = undefined;
        search(req, res);
        return;
    }

    if (!response.ok) {
        console.error(response)
        console.error(response.status)
        console.error(await response.text());
        res.status(500).send("Error getting data from Spotify, try again in a minute.");
        return;
    }

    const json = await response.json();
    res.send(json);
};

const requestAccessToken = async () => {
    const data = new FormData();
    data.append("grant_type", "client_credentials");

    const authorization = Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authorization}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        console.error(response)
        console.error(response.status)
        console.error(await response.text());
        accessToken = undefined;
        return;
    }

    const json = await response.json();
    if (!json.access_token) {
        console.error(json);
        accessToken = undefined;
        return;
    }

    accessToken = json.access_token;
};