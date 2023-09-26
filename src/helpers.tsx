import AES from "crypto-js/aes";
import { DateTime } from "luxon";
import Toastify from "toastify-js";
import ldb, { Log } from "./db";
import { signOutAndCleanUp, db } from "./firebase";
import history from "./history";
import aesutf8 from "crypto-js/enc-utf8";
import hash from "crypto-js/sha512";
import { getIdToken, User } from "firebase/auth";
import { get, orderByKey, query, ref } from "firebase/database";
import { GraphConfig } from "./screeners/screener";
import Fuse from "fuse.js";
import { murmurhash3_32_gc } from "./murmurhash3_gc";
import UAParser from "ua-parser-js";
export interface AnyMap {
    [key: string]: any;
}

export enum PullDataStates {
    NOT_STARTED,
    NOT_ENOUGH_DATA
}

export function getTime() {
    return Math.round(Date.now() / 1000);
}

export function getDateFromLog(log: Log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

export const BASELINE_GRAPH_CONFIG: GraphConfig = {
    yAxisLabel: "baseline (-5 to 5 scale)",
    lines: [{
        key: "Mood",
        color: "#955196"
    }],
    yAxisWidth: 60
};

const SECONDS_IN_DAY = 86400;
// https://materializecss.com/color
export const COLORS: AnyMap = {
    "-5": "#d50000",
    "-4": "#f44336", // red accent-4
    "-3": "#f57c00", // orange darken-2
    "-2": "#ffb300", // amber darken-1
    "-1": "#fdd835", // yellow darken-1
    "0": "#03a9f4",  // light-blue
    "1": "#4fc3f7",  // light-blue lighten-2
    "2": "#cddc39",  // lime
    "3": "#8bc34a",  // light-green
    "4": "#43a047",  // green darken-1
    "5": "#1b5e20"   // green darken-3
};

// based on jet color scale
export const COLORS_CB: AnyMap = {
    "-5": "var(--background-color-inverted)",
    "-4": "#120176",
    "-3": "#4000B5",
    "-2": "#9301D1",
    "-1": "#AD0293",
    "0": "#D2123A",
    "1": "#F25701",
    "2": "#FFA500",
    "3": "#FDC803",
    "4": "#FFE704",
    "5": "var(--background-color-inverted)"
};

export const BASE_URL = process.env.REACT_APP_BASE_URL || "https://api.getbaseline.app";

export function createPoints(data: Log[], colors: AnyMap) {
    let points = [];
    for (let point of data) {
        let [h, rest] = point.time.split(":");
        let hour = Number(h);
        if (hour === 12) hour = 0;
        let [m, meridiem] = rest.split(" ");
        let minute = Number(m);
        const time = DateTime.fromObject({hour: (meridiem === "AM" ? hour : hour + 12), minute}, {zone: point.zone});
        const seconds = (time.toSeconds() - time.startOf("day").toSeconds());
        const style = {
            left: `min(${seconds / SECONDS_IN_DAY * 100}%, calc(100% - 6px))`,
            top: `${(10 - (point.mood + 5)) * 6.5 + 25}%`,
            backgroundColor: colors[point.mood]
        };
        points.push(<div className="marker" key={point.timestamp} style={style}></div>);
    }

    return points;
}

export function getMoodLogListBound(el: HTMLElement, node: HTMLElement, offset: number) {
    return node.offsetTop - el.getBoundingClientRect().y + offset;
}

export function toast(message: string, gravity?: Toastify.Options["gravity"], duration?: number) {
    Toastify({
        text: message,
        duration: duration || 3000,
        gravity: gravity || "top",
        position: "center",
        style: {
            "border-radius": "10px",
        },
        offset: {
            y: (gravity === "bottom") ? "5px" : "max(calc(env(safe-area-inset-top) - 5px), 0px)",
            x: 0
        },
        stopOnFocus: false
    }).showToast();
}

export function networkFailure(message: string) {
    return message === "Load failed" || message.includes("Failed to fetch");
}

export function checkKeys() {
    const keys = localStorage.getItem("keys");

    console.log(BASE_URL)
    if (!keys) {
        const pdpSetting = parseSettings()["pdp"];
        if (pdpSetting) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) {
                const ekeys = decrypt(JSON.parse(localStorage.getItem("ekeys") ?? "{}")["keys"], pwd);
                if (!ekeys) {
                    toast("Something went wrong, please sign in again.");
                    signOutAndCleanUp();
                    return;
                }
                
                return JSON.parse(ekeys);
            }

            if (pdpSetting === "upfront") {
                history.push("/unlock");
                return "upfront";
            } else {
                if (!["/summary", "/rsummary", "/settings", "/unlock"].includes(history.location.pathname)) history.push("/summary");
                return "discreet";
            }
        }

        return false;
    }

    return JSON.parse(keys);
}

export function goBackSafely() {
    history.length > 2 ? history.goBack() : history.push("/summary");
}

export function parseSettings() {
    let data: AnyMap = {};
    try {
        data = JSON.parse(localStorage.getItem("settings") ?? "{}");
    } catch {}
    return data;
}

// NOTE: Old password comes in hashed, new password does not
export async function changeDatabaseEncryption(oldPwd: string, newPwd: string) {
    let logs = await ldb.logs.toArray();

    // Undo encryption if we're changing passphrases or removing an old one
    if (oldPwd) {
        for (let i = 0; i < logs.length; ++i) {
            logs[i].journal = decrypt(logs[i].ejournal ?? "", oldPwd);
            logs[i].ejournal = "";
            if (logs[i].efiles) {
                logs[i].files = JSON.parse(decrypt(logs[i].efiles ?? "[]", oldPwd));
                delete logs[i].efiles;
            }
        }
        
        if (!newPwd) await ldb.logs.bulkPut(logs);
        
        // Reconstruct keys
        let keys = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        localStorage.setItem("keys", decrypt(keys.keys, oldPwd));
        localStorage.removeItem("ekeys");
        sessionStorage.removeItem("pwd");
    }

    if (newPwd) {
        // Encryption needed
        // Construct new passphrase
        newPwd = hash(newPwd).toString();

        // Encrypt data
        for (let i = 0; i < logs.length; ++i) {
            logs[i].ejournal = encrypt(logs[i].journal ?? "", newPwd);
            logs[i].journal = "";
            if (logs[i].files) {
                logs[i].efiles = encrypt(JSON.stringify(logs[i].files), newPwd);
                delete logs[i].files;
            }
        }
        
        await ldb.logs.bulkPut(logs);

        // Set keys
        const keys = localStorage.getItem("keys") ?? "";
        setEkeys(keys, newPwd);
    }
}

export function setEkeys(keys: string, pwd: string) {
    localStorage.setItem("ekeys", JSON.stringify({
        keys: encrypt(keys, pwd),
        hash: hash(keys).toString()
    }));

    sessionStorage.setItem("pwd", pwd);
    localStorage.removeItem("keys");
}

export function setSettings(key: string, value: any) {
    let data = parseSettings();
    data[key] = value;
    localStorage.setItem("settings", JSON.stringify(data));
}

export function checkPassphrase(passphrase: string): boolean {
    try {
        const keyData = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        return hash(decrypt(keyData.keys, hash(passphrase).toString(), false)).toString() === keyData.hash
    } catch {
        return false;
    }
}

export async function makeRequest(route: string, user: User, body: AnyMap, setSubmitting?: (_: boolean) => void) {
    let response;
    let toasted = false;
    try {
        response = await fetch(`${BASE_URL}/${route}`,{
            method: "POST",
            headers: {
                "Authorization": `Bearer ${await getIdToken(user)}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    } catch (e: any) {
        if (networkFailure(e.message)) {
            toast(`We can't reach our servers. Check your internet connection and try again.`);
        } else {
            toast(`Something went wrong, please try again! \nError: ${e.message}`);
        }
        toasted = true;
    }

    if (response && !toasted) {
        if (!response.ok) {
            toast(`Something went wrong, please try again! \nError: ${await response.text()}`);
        } else {
            return true;
        }
    } else {
        toast(`Something went wrong, please try again!`);
    }

    if (setSubmitting) setSubmitting(false);
    return false;
}

export function encrypt(data: string, key: string) {
    try {
        return AES.encrypt(data, key).toString();
    } catch {
        toast("Data encryption failed, so as a security precaution, we ask that you sign in again.");
        signOutAndCleanUp();
        return "";
    }
}

export function decrypt(data: string, key: string, signOut=true) {
    try {
        return AES.decrypt(data, key).toString(aesutf8);
    } catch {
        if (signOut) {
            toast("Data decryption failed, so as a security precaution, we ask that you sign in again.");
            signOutAndCleanUp();
        }
    }

    return "";
}

export async function parseSurveyHistory(user: User, setSurveyHistory: (_: (AnyMap[] | PullDataStates)) => void) {
    if (!user) return;
    const keys = checkKeys();
    get(query(ref(db, `${user.uid}/surveys`), orderByKey())).then(snap => {
        let val = snap.val();
        for (let key in val) {  
            if (typeof val[key]["results"] === "string") {
                val[key]["results"] = JSON.parse(decrypt(val[key]["results"], `${keys.visibleKey}${keys.encryptedKeyVisible}`));
            }
        }

        if (val) {
            setSurveyHistory(val);
        } else {
            setSurveyHistory(PullDataStates.NOT_ENOUGH_DATA);
        }
    });
}

const BASELINE_DAYS = 14;
export async function calculateBaseline(
        setBaselineGraph: (_: AnyMap[] | PullDataStates) => void, 
        timeframe: {years?: number, months?: number} = {years: 1}
    ) {
    const logs = await ldb.logs.where("timestamp").above(DateTime.now().minus(timeframe).toMillis()).toArray();
    if (!logs.length) {
        setBaselineGraph(PullDataStates.NOT_ENOUGH_DATA);
        return;
    }

    let currentDate = getDateFromLog(logs[0]);
    let ptr = 0;
    let perDayDates = [];
    let perDayAverages = [];
    const now = DateTime.local();
    // Aggregate average mood data per day
    while (currentDate < now) {
        let todaySum = 0;
        let ctr = 0;
        while (
            ptr < logs.length 
            && logs[ptr].day === currentDate.day 
            && logs[ptr].month === currentDate.month 
            && logs[ptr].year === currentDate.year
        ) {
            if (logs[ptr].average === "average") {
                todaySum += logs[ptr].mood;
                ++ctr;
            } else {
                todaySum += logs[ptr].mood * 0.4;
                ++ctr;
            }
            ++ptr;
        }
        perDayAverages.push(ctr === 0 ? 0 : todaySum / ctr);
        perDayDates.push(currentDate.toFormat("LLL d"))
        currentDate = currentDate.plus({"days": 1});
    }

    // We're adding an extra week to the base days,
    // to ensure people can actually see a trend
    if (perDayAverages.length <= BASELINE_DAYS + 7) {
        setBaselineGraph(PullDataStates.NOT_ENOUGH_DATA);
        return;
    }

    let sum = 0;
    let i = 0;
    while (i < BASELINE_DAYS) {
        sum += perDayAverages[i];
        ++i;
    }

    // Start average with base 14 days
    let baseline = [];
    baseline.push({
        date: perDayDates[i - 1],
        Mood: sum / BASELINE_DAYS
    });

    // Calculate rolling average to end of list
    while (i < perDayAverages.length) {
        sum -= perDayAverages[i - BASELINE_DAYS];
        sum += perDayAverages[i];
        baseline.push({
            date: perDayDates[i],
            Mood: sum / BASELINE_DAYS
        });
        ++i;
    }

    setBaselineGraph(baseline);
}

export function filterLogs(
    searchText: string,
    numberFilter: number[],
    averageFilter: string[],
    imageFilter: boolean,
    logs: Log[], 
    setFilteredLogs: (logs: Log[]) => void
) {
    if (!searchText && !numberFilter.length && !averageFilter.length && !imageFilter) {
        setFilteredLogs(logs);
        return;
    }

    if (imageFilter) logs = logs.filter(x => x.files && x.files.length > 0);
    if (numberFilter.length) logs = logs.filter(x => numberFilter.includes(x.mood));
    if (averageFilter.length) logs = logs.filter(x => averageFilter.includes(x.average));

    if (searchText) {
        const fuse = new Fuse(logs, {
            keys: ["journal"],
            shouldSort: false,
            findAllMatches: true,
            ignoreLocation: true,
            threshold: 0.2
        });

        logs = fuse.search(searchText).map(x => x.item);
    }

    setFilteredLogs(logs);
}

export function fingerprint() {
    let fingerprint = "";
    const ua = new UAParser().getResult();
    fingerprint += `${ua.os.name}${ua.os.version}${ua.device.vendor}${ua.device.model}${ua.device.type}`;
    fingerprint += `${navigator.language}${navigator.platform}${navigator.maxTouchPoints}`;
    fingerprint += `${window.screen.width}${window.screen.height}`;
    fingerprint += `|${new Date().getTimezoneOffset()}`;
    const hash = murmurhash3_32_gc(fingerprint, 921743158);
    return hash;
}