import history from "./history";

document.addEventListener("resume", () => {
    history.push("/journal");
});

document.addEventListener("deviceready", () => {
    history.push("/journal");
});