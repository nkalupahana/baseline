import { checkKeys, parseSettings } from "./helpers";
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

window.onbeforeunload = () => {
    if (window.location.pathname !== "/journal/finish" || window.location.hash !== "#attach") sessionStorage.removeItem("pwd");
};