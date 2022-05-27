import AES from "crypto-js/aes";
import { DateTime } from "luxon";
import Toastify from "toastify-js";
import ldb, { Log } from "./db";
import { signOutAndCleanUp } from "./firebase";
import history from "./history";
import aesutf8 from "crypto-js/enc-utf8";
import hash from "crypto-js/sha512";
import { getIdToken, User } from "firebase/auth";

export interface AnyMap {
    [key: string]: any;
}

export function getTime() {
    return Math.round(Date.now() / 1000);
}

export function getDateFromLog(log: Log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

const SECONDS_IN_DAY = 86400;
// https://materializecss.com/color
const COLORS: AnyMap = {
    "-5": "black",
    "-4": "#d50000", // red accent-4
    "-3": "#f57c00", // orange darken-2
    "-2": "#ffb300", // amber darken-1
    "-1": "#fdd835", // yellow darken-1
    "0": "#03a9f4",  // light-blue
    "1": "#4fc3f7",  // light-blue lighten-2
    "2": "#cddc39",  // lime
    "3": "#8bc34a",  // light-green
    "4": "#43a047",  // green darken-1
    "5": "black"
};

export function createPoints(data: Log[]) {
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
            backgroundColor: COLORS[point.mood]
        };
        points.push(<div className="marker" key={point.timestamp} style={style}></div>);
    }

    return points;
}

export const LOCATOR_OFFSET = 30;

export function getMoodLogListBound(el: HTMLElement, node: HTMLElement) {
    return node.offsetTop - el.getBoundingClientRect().y + LOCATOR_OFFSET;
}

export function toast(message: string, gravity?: Toastify.Options["gravity"]) {
    Toastify({
        text: message,
        duration: 3000,
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

    if (!keys) {
        const pdpSetting = parseSettings()["pdp"];
        if (pdpSetting) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) {
                const ekeys = AES.decrypt(JSON.parse(localStorage.getItem("ekeys") ?? "{}")["keys"], pwd).toString(aesutf8);
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
            logs[i].journal = AES.decrypt(logs[i].ejournal ?? "", oldPwd).toString(aesutf8);
            logs[i].ejournal = "";
        }
        
        if (!newPwd) await ldb.logs.bulkPut(logs);
        
        // Reconstruct keys
        let keys = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        localStorage.setItem("keys", AES.decrypt(keys.keys, oldPwd).toString(aesutf8));
        localStorage.removeItem("ekeys");
        sessionStorage.removeItem("pwd");
    }

    if (newPwd) {
        // Encryption needed
        // Construct new passphrase
        newPwd = hash(newPwd).toString();

        // Encrypt data
        for (let i = 0; i < logs.length; ++i) {
            logs[i].ejournal = AES.encrypt(logs[i].journal ?? "", newPwd).toString();
            logs[i].journal = "";
        }
        await ldb.logs.bulkPut(logs);

        // Set keys
        const keys = localStorage.getItem("keys") ?? "";
        setEkeys(keys, newPwd);
    }
}

export function setEkeys(keys: string, pwd: string) {
    localStorage.setItem("ekeys", JSON.stringify({
        keys: AES.encrypt(keys, pwd).toString(),
        hash: hash(keys).toString()
    }));

    sessionStorage.setItem("pwd", pwd);
    localStorage.removeItem("keys");
}

export function setSettings(key: string, value: string) {
    let data = parseSettings();
    data[key] = value;
    localStorage.setItem("settings", JSON.stringify(data));
}

export function checkPassphrase(passphrase: string): boolean {
    try {
        const keyData = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        return hash(AES.decrypt(keyData.keys, hash(passphrase).toString()).toString(aesutf8)).toString() === keyData.hash
    } catch {
        return false;
    }
}

export async function makeRequest(route: string, user: User, body: AnyMap, setSubmitting: (_: boolean) => void) {
    let response;
    let toasted = false;
    try {
        response = await fetch(`https://us-central1-getbaselineapp.cloudfunctions.net/${route}`,{
            method: "POST",
            headers: {
                Authorization: `Bearer ${await getIdToken(user)}`,
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
            setSubmitting(false);
            return true;
        }
    } else {
        toast(`Something went wrong, please try again!`);
    }

    setSubmitting(false);
    return false;
}