import { Response } from "express";
import { getDatabase } from "firebase-admin/database";
import { DateTime } from "luxon";
import { UserRequest, validateKeys } from "./helpers.js";
import { auth as googleauth , sheets } from "@googleapis/sheets";
import { AES } from "crypto-js";

export const gapFund = async (req: UserRequest, res: Response) => {
    const body = req.body;
    const db = getDatabase();
    const encryptionKey = await validateKeys(body.keys, db, req.user!.user_id);

    if (!encryptionKey) {
        res.send(400); 
        return;
    }

    // Validation
    for (const key of ["email", "need", "amount", "method"]) {
        if (typeof body[key] !== "string" || body[key].trim().length === 0 || body[key].length >= 10000) {
            res.send(400);
            return;
        }
    }

    // Get user statistics for fraud detection
    const logRef = db.ref(`/${req.user!.user_id}/logs`);
    const firstLog = Number(Object.keys(await (await logRef.limitToFirst(1).get()).val())[0]);

    const lastLogs = await (await logRef.limitToLast(25).get()).val();
    let lastLogStr = "";
    for (const key in lastLogs) {
        lastLogStr += DateTime.fromMillis(Number(key)).toRFC2822() + "\n";
    }

    // Simple date validation (real fraud detection will be done manually in the sheet)
    if (Object.keys(lastLogs).length < 7 || DateTime.now().minus({ days: 5 }).toMillis() < firstLog) {
        res.send(400);
        return;
    }

    // Put data in user's database
    const gapFundRef = db.ref(`/${req.user!.user_id}/gapFund`);
    const currentData = await (await gapFundRef.get()).val();
    if (currentData) {
        res.send(400);
        return;
    }

    const data = {
        email: body.email,
        need: body.need,
        amount: body.amount,
        method: body.method
    };

    await gapFundRef.set({
        data: AES.encrypt(JSON.stringify(data), encryptionKey).toString()
    });

    // Write to spreadsheet
    const auth = await googleauth.getClient({
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const api = sheets({ version: 'v4', auth });
    await api.spreadsheets.values.append({
        spreadsheetId: "1N3Ecex6TVeWQvd1uKBNtf__XBASx47i5wBktTSbjdus",
        range: "A2:J9999",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[
                req.user!.user_id, 
                body.email, 
                body.need, 
                body.amount, 
                body.method, 
                lastLogStr, // Last log dates
                DateTime.fromMillis(Number(firstLog)).toRFC2822(), // First log
                "New", // Status
                "Needs Review ASAP", // Progression
                `https://console.firebase.google.com/u/0/project/getbaselineapp/database/getbaselineapp-default-rtdb/data/${req.user!.user_id}~2FgapFund`
            ]]
        }
    });

    res.send(200);
}