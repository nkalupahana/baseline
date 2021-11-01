import history from "./history";

function check() {
    if (!window.location.pathname.startsWith("/journal")) {
        history.push("/journal");
    }
}

document.addEventListener("resume", check);
document.addEventListener("deviceready", check);