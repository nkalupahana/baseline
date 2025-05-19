import { getDatabase } from "firebase-admin/database";
import { AnyMap, UserRequest, validateKeys } from "./helpers.js";
import { Response } from "express";
import { DateTime } from "luxon";
import AES from "crypto-js/aes.js";
import aesutf8 from "crypto-js/enc-utf8.js";

const FETCH_LIMIT = 100;
const FETCH_ADDITIONAL = 10;

enum Danger {
    JOURNALED_TODAY = 0,
    JOURNALED_YESTERDAY = 1,
    JOURNALED_TWO_DAYS_AGO = 2,
    NO_RECOVERY = 3
}

interface StreakResponse {
    streak: number;
    danger: Danger;
    entriesToday: number;
}

export const calculateStreak = async (req: UserRequest, res: Response<StreakResponse>) => {
    const db = getDatabase();
    const data = req.body;
    const encryptionKey = await validateKeys(data.keys, db, req.user!.user_id);
    console.log(req.user!.user_id)

    if (!encryptionKey) {
        res.sendStatus(400);
        return;
    }

    let today = DateTime.fromISO(data.currentDate);
    if (!data.currentDate || typeof data.currentDate !== "string" || !today.isValid) {
        res.sendStatus(400);
        return;
    }

    const logRef = db.ref(req.user!.user_id + "/logs").orderByKey();
    const logs: AnyMap = await (await logRef.limitToLast(FETCH_LIMIT + FETCH_ADDITIONAL).get()).val();
    if (!logs || Object.keys(logs).length === 0) {
        res.send({ streak: 0, danger: Danger.NO_RECOVERY, entriesToday: 0 });
        return;
    }

    let latestLog: AnyMap = JSON.parse(AES.decrypt(logs[Object.keys(logs).at(-1)!].data, encryptionKey).toString(aesutf8));
    let top = DateTime.fromObject({ year: latestLog.year, month: latestLog.month, day: latestLog.day });
    // If the first log is in the future, mark that as
    // the starting date ("today") for the sake of streak calculation.
    if (top > today) {
        today = top;
    }

    const topISO = top.toISODate();
    let danger = Danger.NO_RECOVERY;
    if (topISO === today.toISODate()) {
        danger = Danger.JOURNALED_TODAY;
    } else if (topISO === today.minus({ days: 1 }).toISODate()) {
        danger = Danger.JOURNALED_YESTERDAY;
    } else if (topISO === today.minus({ days: 2 }).toISODate()) {
        danger = Danger.JOURNALED_TWO_DAYS_AGO;
    }  

    // If the top log is not in the last two days, the streak is 0 and cannot be recovered
    if (danger === Danger.NO_RECOVERY) {
        res.send({ streak: 0, danger: Danger.NO_RECOVERY, entriesToday: 0 });
        return;
    }

    const decryptedLogs = [];
    let checkableKeys = Object.keys(logs).length < FETCH_LIMIT ? Object.keys(logs).length : FETCH_LIMIT
    for (const key of Object.keys(logs)) {
        const log = JSON.parse(AES.decrypt(logs[key].data, encryptionKey).toString(aesutf8));
        decryptedLogs.push({ ...log, timestamp: Number(key) });
    }
    decryptedLogs.sort((a, b) => b.year - a.year || b.month - a.month || b.day - a.day || b.timestamp - a.timestamp);

    let streak = 1;
    let entriesToday = 0;
    let i = 0;
    while (true) {
        let running = true;
        console.log("Running", i, checkableKeys, decryptedLogs.length);
        // Same general logic as `calculateStreak` in the frontend
        // (max change of one day to continue streak)
        while (i < checkableKeys) {
            const log = decryptedLogs[i];
            if (streak === 1 && today.day === log.day && today.month === log.month && today.year === log.year) {
                ++entriesToday;
            }

            if (top.day !== log.day || top.month !== log.month || top.year !== log.year) {
                const logDT = DateTime.fromObject({ year: log.year, month: log.month, day: log.day });
                if (logDT.toISODate() === top.minus({ days: 1 }).toISODate()) {
                    top = logDT;
                    ++streak;
                } else {
                    running = false;
                    break;
                }
            }
            ++i;
        }

        // If the streak is going and we've run out of logs, but we know there are more
        // (in the additional segment), try to fetch more
        if (running && decryptedLogs[checkableKeys]) {
            console.log("More!");
            const newLogs: AnyMap = await (await logRef.endBefore(String(decryptedLogs.at(-1).timestamp)).limitToLast(FETCH_LIMIT).get()).val();
            // If there are no new logs, run the search on the entire log list
            if (!newLogs || Object.keys(newLogs).length === 0) {
                checkableKeys = decryptedLogs.length;
            } else {
                // Otherwise, decrypt the new logs, add them to the list, sort, and run again
                for (const key of Object.keys(newLogs)) {
                    const log = JSON.parse(AES.decrypt(newLogs[key].data, encryptionKey).toString(aesutf8));
                    decryptedLogs.push({ ...log, timestamp: Number(key) });
                }
                decryptedLogs.sort((a, b) => b.year - a.year || b.month - a.month || b.day - a.day || b.timestamp - a.timestamp);
                checkableKeys += FETCH_ADDITIONAL;
                checkableKeys += Object.keys(newLogs).length < (FETCH_LIMIT - FETCH_ADDITIONAL) ? Object.keys(newLogs).length : (FETCH_LIMIT - FETCH_ADDITIONAL);
            }
        } else break;
    }

    res.send({ streak, danger, entriesToday });
};