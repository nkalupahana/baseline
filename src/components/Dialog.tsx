import { DateTime } from "luxon";
import "./Dialog.css";

// get/set for last shown (dialogs)
export const getLastShown = (key: string) => {
    const lastShown = JSON.parse(localStorage.getItem("lastShown") ?? "{}");
    return lastShown[key] ?? 0;
}

export const checkPromptAllowed = (key: string, days: number) => {
    const now = DateTime.local();
    if (DateTime.fromMillis(getLastShown(key)) < now.minus({ days })) {
        setLastShown(key, now.toMillis());
        return true;
    }

    return false;
}

export const setLastShown = (key: string, value: number) => {
    const lastShown = JSON.parse(localStorage.getItem("lastShown") ?? "{}");
    lastShown[key] = value;
    localStorage.setItem("lastShown", JSON.stringify(lastShown));
}

const Dialog = ({ children, title } : { children: JSX.Element, title: string }) => {
    return <div className="dialog-background">
        <div className="dialog">
            <div className="dialog-title">{ title }</div>
            { children }
        </div>
    </div>
};

export default Dialog;