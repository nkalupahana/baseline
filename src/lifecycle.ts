import ldb from "./db";
import { parseSettings } from "./helpers";
import history from "./history";

const THRESHOLD_SEC = 60 * 3;

function getTime() {
    return Math.round(Date.now() / 1000);
}

function setLastOpenedTime() {
    window.localStorage.setItem("lastOpenedTime", String(getTime()));
}

function redirect() {
    if (!window.location.pathname.startsWith("/journal") && !window.location.pathname.startsWith("/review")) {
        let lastOpenedTime = Number(window.localStorage.getItem("lastOpenedTime"));
        if (getTime() - lastOpenedTime > THRESHOLD_SEC) {
            history.push("/journal");
        }
    }

    setLastOpenedTime();
}

document.addEventListener("resume", redirect);
document.addEventListener("deviceready", redirect);
document.addEventListener("pause", setLastOpenedTime);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
        if (parseSettings()["pdp"]) {
            localStorage.removeItem("keys");
            ldb.logs.clear();
        }
    } else {
        if (localStorage.getItem("ekeys") && !localStorage.getItem("keys")) {
            if (parseSettings()["pdp"] === "upfront") {
                history.push("/unlock");
            }
        }
    }
});