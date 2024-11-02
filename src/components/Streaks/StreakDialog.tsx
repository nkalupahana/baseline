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

enum OpenDialog {
    NONE,
    FIRST_DAY,
    CONTINUING
}

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
        if ([OpenDialog.FIRST_DAY, OpenDialog.CONTINUING].includes(settings.streakDialog)) {
            setOpenDialog(settings.streakDialog);
        }
    }, [streak]);

    useEffect(() => {
        if (!user) return;
        get(ref(db, `/${user.uid}/prompts/streak`)).then(snap => {
            const shownStreakTime = snap.val() ?? 0;
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
    </>;
};

export default StreakDialog;