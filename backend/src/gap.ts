import { Response } from "express";
import { getDatabase } from "firebase-admin/database";
import { DateTime } from "luxon";
import { UserRequest, validateKeys } from "./helpers.js";
import { auth as googleauth, sheets } from "@googleapis/sheets";
import AES from "crypto-js/aes.js";
import { gmail } from "@googleapis/gmail";

interface EmailBody {
    to: string;
    from: string;
    subject: string;
    message: string;
}

export const gapFund = async (req: UserRequest, res: Response) => {
    const body = req.body;
    const db = getDatabase();
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);

    if (!encryptionKey) {
        res.send(400); 
        return;
    }

    // Input validation
    for (const key of ["email", "need", "amount", "method", "location", "zone"]) {
        if (typeof body[key] !== "string" || body[key].trim().length === 0 || body[key].length >= 10000) {
            res.status(400).send("Please update baseline to submit this request.");
            return;
        }
    }
    
    // Ensure front-end qualifying validation was not bypassed
    const logRef = db.ref(`/${req.user!.user_id}/logs`);

    const dayWindow = DateTime.now().setZone(body.zone).endOf("day").minus({ days: 18 });
    const windowedTimestamps = Object.keys((await (await logRef.orderByKey().startAt(String(dayWindow.toMillis())).get()).val()));
    let dates = new Set();
    for (const timestamp of windowedTimestamps) {
        dates.add(DateTime.fromMillis(Number(timestamp), { zone: body.zone }).toISODate());
    }

    if (dates.size < 14) {
        res.status(400).send("Unfortunately, you don't qualify for the Gap Fund yet. Please make sure you've updated baseline, and try again later.");
        return;
    }

    // Get user statistics for simple fraud detection
    const firstLog = Number(Object.keys(await (await logRef.limitToFirst(1).get()).val())[0]);
    const lastLogs = await (await logRef.limitToLast(25).get()).val();
    let lastLogStr = "";
    for (const key in lastLogs) {
        lastLogStr += DateTime.fromMillis(Number(key)).toRFC2822() + "\n";
    }

    // Put data in user's database
    const gapFundRef = db.ref(`/${req.user!.user_id}/gapFund`);
    const currentData = await (await gapFundRef.get()).val();
    if (currentData) {
        res.send(400);
        return;
    }

    // Write to spreadsheet
    const auth = await googleauth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const api = sheets({ version: 'v4', auth });
    await api.spreadsheets.values.append({
        spreadsheetId: "1N3Ecex6TVeWQvd1uKBNtf__XBASx47i5wBktTSbjdus",
        range: "A2:K9999",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[
                req.user!.user_id, 
                body.email,
                body.need,
                body.amount,
                body.method,
                body.location,
                lastLogStr, // Last log dates
                DateTime.fromMillis(Number(firstLog)).toRFC2822(), // First log
                "New", // Status
                "Needs Review ASAP", // Progression
                `https://console.firebase.google.com/u/0/project/getbaselineapp/database/getbaselineapp-default-rtdb/data/${req.user!.user_id}~2FgapFund`
            ]]
        }
    });

    // Write to database, if spreadsheet worked
    const data = {
        email: body.email,
        need: body.need,
        amount: body.amount,
        method: body.method
    };

    await gapFundRef.set({
        data: AES.encrypt(JSON.stringify(data), encryptionKey).toString()
    });

    await sendNotificationEmail();

    res.send(200);
}

const sendNotificationEmail = async () => {
    const auth = await googleauth.getClient({
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
        clientOptions: {
            subject: "nisala@getbaseline.app"
        },
        keyFile: "getbaselineapp-svc-email.json"
    });

    const makeBody = (params: EmailBody) => {
        params.subject = Buffer.from(params.subject).toString("base64");
        const str = [
            'Content-Type: text/plain; charset="UTF-8"\n',
            "MINE-Version: 1.0\n",
            "Content-Transfer-Encoding: 7bit\n",
            `to: ${params.to} \n`,
            `from: ${params.from} \n`,
            `subject: =?UTF-8?B?${params.subject}?= \n\n`,
            params.message
        ].join("");

        return Buffer.from(str)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const api = gmail({ version: "v1", auth });
    await api.users.messages.send({
        userId: "me",
        requestBody: {
            raw: makeBody({
                to: "nisala@getbaseline.app",
                from: "gapfund@getbaseline.app",
                subject: "[URGENT] Gap Fund Request",
                message: `A new gap fund request has been submitted.`
            })
        }
    });
}