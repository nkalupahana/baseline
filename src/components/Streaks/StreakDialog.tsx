import { useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { get, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import StreakContext from "./StreakContext";
import Dialog from "../Dialog";
import StreakBadge from "./StreakBadge";

enum OpenDialog {
    NONE,
    FIRST_DAY,
    CONTINUING
}

const StreakDialog = () => {
    const streak = useContext(StreakContext);
    const [shownStreak, setShownStreak] = useState<number | undefined>(undefined);
    const [user] = useAuthState(auth);
    const [openDialog, setOpenDialog] = useState(OpenDialog.NONE);

    useEffect(() => {
        if (!user) return;
        get(ref(db, `/${user.uid}/prompts/streak`)).then(snap => {
            const data = snap.val() ?? 0;
            setShownStreak(data);
        });
    }, [user]);

    useEffect(() => {
        if (shownStreak === undefined || !user) return;
        let newShownStreak = null;

        if (streak > 0 && streak > shownStreak) {
            if (streak === 1) {
                console.log("Starting streak message");
                newShownStreak = 1;
                setOpenDialog(OpenDialog.FIRST_DAY);
            } else if (streak % 10 === 0) {
                console.log("Streak is a multiple of 10 message");
                newShownStreak = streak;
                setOpenDialog(OpenDialog.CONTINUING);
            }
        }

        if (newShownStreak) {
            //set(ref(db, `/${user.uid}/prompts/streak`), newShownStreak);
        }
    }, [user, streak, shownStreak]);

    return <>
        { openDialog === OpenDialog.FIRST_DAY && <Dialog title="Great work getting started.">
            <StreakBadge />
            <p>It's the first day of your streak. Keep it up!</p>
        </Dialog> }
    </>;
};

export default StreakDialog;