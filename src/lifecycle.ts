import { checkKeys, parseSettings } from "./helpers";
import history from "./history";
import * as Sentry from "@sentry/react";

const THRESHOLD_SEC = 60 * 3;

function getTime() {
    return Math.round(Date.now() / 1000);
}

function setLastOpenedTime() {
    window.localStorage.setItem("lastOpenedTime", String(getTime()));
}

function redirect() {
    if (!["/journal", "/review", "/onboarding"].some(path => window.location.pathname.startsWith(path))) {
        let lastOpenedTime = Number(window.localStorage.getItem("lastOpenedTime"));
        if (getTime() - lastOpenedTime > THRESHOLD_SEC) {
            if (checkKeys() !== "upfront") history.push("/journal");
        }
    }

    setLastOpenedTime();
}

document.addEventListener("resume", redirect);
document.addEventListener("deviceready", redirect);
document.addEventListener("pause", setLastOpenedTime);
document.addEventListener("visibilitychange", () => {
    if (parseSettings()["pdp"] && (window.location.pathname !== "/journal/finish" || window.location.hash !== "#attach")) {
        sessionStorage.removeItem("pwd");
        window.location.href = "/rsummary";
    }
});

window.addEventListener("unhandledrejection", (event) => {
    if (event.reason.message.toLowerCase().includes("refresh")) {
        console.log("Unhandled rejection, refreshing. (1)");
        Sentry.addBreadcrumb({
            message: "Unhandled rejection, refreshing. (2)"
        });
        Sentry.flush(1000).then(() => window.location.reload());
    }
});

window.onbeforeunload = () => {
    if (window.location.pathname !== "/journal/finish" || window.location.hash !== "#attach") sessionStorage.removeItem("pwd");
};