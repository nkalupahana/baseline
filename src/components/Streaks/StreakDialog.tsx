import { useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { get, ref, serverTimestamp, set } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import StreakContext from "./StreakContext";
import Dialog from "../Dialog";
import StreakBadge from "./StreakBadge";
import { DateTime } from "luxon";
import { share } from "./helpers";
import { parseSettings, setSettings } from "../../helpers";
import { Capacitor } from "@capacitor/core";
import widgetImage from "./widgets.png"

enum OpenDialog {
    NONE,
    FIRST_DAY,
    CONTINUING,
    WIDGETS
}

/**
 * TODO: This component manages all dialogs on the summary page, because
 * they need to be mutually exclusive. The name should eventually be refactored,
 * but it doesn't really matter.
 */
const StreakDialog = () => {
    const streak = useContext(StreakContext);
    const [user] = useAuthState(auth);
    const [openDialog, setOpenDialog] = useState(OpenDialog.NONE);

    const dismissDialog = () => {
        setSettings("streakDialog", OpenDialog.NONE);
        setOpenDialog(OpenDialog.NONE);
    };

    const shareStreak = () => {
        let text;
        if (streak === 1) {
            text = "I just started journaling with baseline, a free non-profit journaling app! Try it out and join me. https://getbaseline.app";
        } else {
            text = `I just got to a ${streak}-day journaling streak on baseline! Try it out and join me. https://getbaseline.app`;
        }

        share(text);
    }

    const bottomButtons = <>
        <div className="finish-button" onClick={shareStreak} style={{"backgroundColor": "var(--dark-action)", "marginBottom": "8px"}}>Share my progress!</div>
        <div className="finish-button" onClick={dismissDialog} style={{"marginBottom": "12px"}}>Close</div>
    </>

    useEffect(() => {
        // Don't show anything if streak isn't loaded yet / is zero
        if (streak === 0) return;

        // This is used to restore the streak dialog in case
        // it was shown but not acknowledged (removed from settings when
        // user clicks the close button)
        const settings = parseSettings();
        if (settings.streakDialog !== OpenDialog.NONE) {
            setOpenDialog(settings.streakDialog);
        }
    }, [streak]);

    useEffect(() => {
        if (!user) return;
        get(ref(db, `/${user.uid}/prompts`)).then(snap => {
            const promptTimes = snap.val() ?? {};
            const shownStreakTime = promptTimes.streak ?? 0;
            let newShownStreak = false;

            // If we have a streak, and it's been a week since we last showed a streak message
            if (streak > 0 && shownStreakTime < DateTime.now().minus({ days: 7 }).toMillis()) {
                // Only ever show the first journaling message once
                if (streak === 1 && shownStreakTime === 0) {
                    newShownStreak = true;
                    setOpenDialog(OpenDialog.FIRST_DAY);
                    setSettings("streakDialog", OpenDialog.FIRST_DAY);
                } else if (streak % 10 === 0) {
                    // Show every ten consecutive days
                    newShownStreak = true;
                    setOpenDialog(OpenDialog.CONTINUING);
                    setSettings("streakDialog", OpenDialog.CONTINUING);
                }
            }

            if (newShownStreak) {
                set(ref(db, `/${user.uid}/prompts/streak`), serverTimestamp());
            } else if (!promptTimes.widgets && Capacitor.getPlatform() === "ios") {
                set(ref(db, `/${user.uid}/prompts/widgets`), serverTimestamp());
                setOpenDialog(OpenDialog.WIDGETS);
                setSettings("streakDialog", OpenDialog.WIDGETS);
            }
        });
    }, [user, streak]);

    return <>
        { openDialog === OpenDialog.FIRST_DAY && <Dialog title="Great work getting started.">
            <div className="br" />
            <StreakBadge />
            <p className="text-center">
                This is the start of your journaling streak, and the first step in 
                taking charge of your mental health. 
            </p>
            <p className="text-center">
                Journal every day to keep your streak going, and to keep improving
                your mental health!
            </p>
            { bottomButtons }
        </Dialog> }
        { openDialog === OpenDialog.CONTINUING && streak > 1 && <Dialog title="Streak milestone!">
            <div className="br" />
            <StreakBadge />
            <p className="text-center">
                Great work keeping your streak going by journaling for { streak } days
                in a row!
            </p>
            { bottomButtons }
        </Dialog> }
        { openDialog === OpenDialog.WIDGETS && <Dialog title="Try our new widgets!">
            <img alt="Two panels. Left panel shows two baseline widgets on the lock screen, showing a streak of 110 days both above and below the clock. Right panel shows a baseline widget on the home screen, showing a streak of 110 days with a fire icon." src={widgetImage} style={{marginTop: "24px", borderRadius: "8px"}} />
            <p className="text-center">Available on both the Lock and Home Screen, these widgets will make sure you never forget to journal. (Plus, we think they look pretty great.) We hope you try them out!</p>
            <div className="finish-button" onClick={dismissDialog} style={{"marginBottom": "12px"}}>Close</div>
        </Dialog> }
    </>;
};

export default StreakDialog;