import { useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { get, ref, serverTimestamp, set } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import StreakContext from "./StreakContext";
import Dialog from "../Dialog";
import StreakBadge from "./StreakBadge";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { toast } from "../../helpers";

enum OpenDialog {
    NONE,
    FIRST_DAY,
    CONTINUING
}

const StreakDialog = () => {
    const streak = useContext(StreakContext);
    const [shownStreakTime, setShownStreakTime] = useState<number | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [openDialog, setOpenDialog] = useState(OpenDialog.NONE);

    const dismissDialog = () => {
        setOpenDialog(OpenDialog.NONE);
    };

    const share = async () => {
        let text;
        if (streak === 1) {
            text = "I just started journaling with baseline, a free non-profit journaling app! Try it out and join me. https://getbaseline.app";
        } else {
            text = `I just got to a ${streak}-day journaling streak on baseline! Try it out and join me. https://getbaseline.app`;
        }

        if (Capacitor.getPlatform() === "web") {
            navigator.clipboard.writeText(text);
            toast("Copied to clipboard!");
        } else {
            try {
                Share.share({ text });
            } catch {}
        }
    }

    const bottomButtons = <>
        <div className="finish-button" onClick={share} style={{"backgroundColor": "var(--dark-action)", "marginBottom": "8px"}}>Share my progress!</div>
        <div className="finish-button" onClick={dismissDialog} style={{"marginBottom": "12px"}}>Close</div>
    </>

    useEffect(() => {
        if (!user) return;
        get(ref(db, `/${user.uid}/prompts/streak`)).then(snap => {
            const data = snap.val() ?? 0;
            setShownStreakTime(data);
        });
    }, [user]);

    useEffect(() => {
        if (shownStreakTime === undefined || !user) return;
        let newShownStreak = false;

        // If we have a streak, and it's been a week since we last showed a streak message
        if (streak > 0 && shownStreakTime < DateTime.now().minus({ days: 7 }).toMillis()) {
            // Only ever show the first journaling message once
            if (streak === 1 && shownStreakTime === 0) {
                newShownStreak = true;
                setOpenDialog(OpenDialog.FIRST_DAY);
            } else if (streak % 10 === 0) {
                // Show every ten consecutive days
                console.log("Streak is a multiple of 10 message");
                newShownStreak = true;
                setOpenDialog(OpenDialog.CONTINUING);
            }
        }

        if (newShownStreak) {
            set(ref(db, `/${user.uid}/prompts/streak`), serverTimestamp());
        }
    }, [user, streak, shownStreakTime]);

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
        { openDialog === OpenDialog.CONTINUING && <Dialog title="Streak milestone!">
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