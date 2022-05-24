import AES from "crypto-js/aes";
import { DateTime } from "luxon";
import Toastify from "toastify-js";
import ldb, { Log } from "./db";
import { signOutAndCleanUp } from "./firebase";
import history from "./history";

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
            if (sessionStorage.getItem("pwd")) {
                const ekeys = localStorage.getItem("ekeys");
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

export async function changeDatabaseEncryption(oldPassword="", newPassword="") {
    console.log("h1");
    if (newPassword) {
        if (oldPassword) {
            // TODO
            console.warn("old password, do something");
        }

        let logs = await ldb.logs.toArray();
        for (let i = 0; i < logs.length; ++i) {
            logs[i].ejournal = AES.encrypt(logs[i].journal ?? "", newPassword).toString();
            logs[i].journal = "";
        }
        console.log(logs);
        await ldb.logs.bulkPut(logs);
    }
}
