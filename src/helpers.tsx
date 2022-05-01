import { DateTime } from "luxon";
import Toastify from "toastify-js";
import { Log } from "./db";

export function getTime() {
    return Math.round(Date.now() / 1000);
}

export function getDateFromLog(log: Log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

const SECONDS_IN_DAY = 86400;
// https://materializecss.com/color
const COLORS: { [key: string]: string } = {
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
            "border-radius": "10px"
        }
    }).showToast();
};

export function networkFailure(message: string) {
    return message === "Load failed" || message.includes("Failed to fetch");
}