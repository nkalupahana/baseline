import { get, ref } from "firebase/database";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ldb from "../../db";
import { auth, db } from "../../firebase";
import history from "../../history";
import "./PromptWeekInReview.css";

const PromptWeekInReview = () => {
    const [, loading] = useAuthState(auth);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (loading) return;
        (async () => {
            if (!auth || !auth.currentUser) return;
            const lastWeekInReview = (await get(ref(db, `/${auth.currentUser.uid}/lastWeekInReview`))).val();
            if (lastWeekInReview) {
                let last = DateTime.fromMillis(lastWeekInReview);
                let change = 0;
                while (last.weekday !== 5) {
                    last = last.plus({ days: 1 });
                    change += 1;
                }

                // If we're past the next Friday at noon, and it's been
                // at least two days since our last week in review, trigger.
                if (DateTime.now() > last.startOf("day").plus({ hours: 12 }) && change > 2) {
                    setShow(true);
                }
            } else {
                // If our first mood log was over 5 days ago
                // and we've never done a week in review before,
                // let's do it!
                const firstLog = await ldb.logs.orderBy("timestamp").limit(1).first();
                if (firstLog) {
                    if (DateTime.now().startOf("day").minus({ days: 5 }).toMillis() > firstLog.timestamp) {
                        setShow(true);
                    }
                }
            }
        })();
    }, [loading]);

    return <>
        { show && <div className="prompt-overlay">
            <div className="container prompt-container">
                <div className="prompt-prompt">
                    <div className="title">Week In Review!</div>
                    <p className="text-center">Take a minute to answer a few questions about your mental health and get an overview of how you felt this week.</p>
                    <div onClick={() => {history.push("/review")}} className="finish-button">Start</div>
                    <div onClick={() => {setShow(false)}} className="finish-button secondary">Remind Me Later</div>
                </div>
            </div>
        </div> }
    </>
};

export default PromptWeekInReview;