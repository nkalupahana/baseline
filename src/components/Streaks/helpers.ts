import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { getDateFromLog, toast } from "../../helpers";
import { Log } from "../../db";
import { DateTime } from "luxon";

export const share = (text: string) => {
    if (Capacitor.getPlatform() === "web") {
        navigator.clipboard.writeText(text);
        toast("Copied streak to clipboard!");
    } else {
        Share.share({ text }).catch(() => {});
    }
}

export function calculateStreak(logs: Log[]) {
    if (!logs || logs.length === 0) return 0;
    
    const today = DateTime.now();
    let top = getDateFromLog(logs[0]);
    if (top.toISODate() !== today.toISODate() && top.toISODate() !== today.minus({ days: 1 }).toISODate()) return 0;
    
    let streak = 1;
    for (const log of logs) {
        // When the date changes, check if it's only changed by one
        // day. If it is, continue the streak, else break.
        if (top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            const logDT = getDateFromLog(log);
            if (logDT.toISODate() === top.minus({ days: 1}).toISODate()) {
                top = logDT;
                ++streak;
            } else {
                break;
            }
        }
    }

    return streak;
}