import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { get, ref, serverTimestamp, set } from "firebase/database";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ldb from "../../db";
import { auth, db } from "../../firebase";
import { AnyMap, checkKeys, makeRequest, parseSettings } from "../../helpers";
import history from "../../history";
import { Device } from "@capacitor/device";
import "./PromptWeekInReview.css";
import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/react";

const PromptWeekInReview = () => {
    const [user] = useAuthState(auth);
    const [show, setShow] = useState(false);
    const skipWIR = parseSettings()["skipWIR"];

    const skipWeek = () => {
        set(ref(db, `/${user.uid}/lastWeekInReview`), serverTimestamp());
        setShow(false);
    };

    useEffect(() => {
        if (!user || typeof checkKeys() !== "object") return;
        (async () => {
            const firstLog = await ldb.logs.orderBy("timestamp").limit(1).first();
            // First, let's make sure the user's been on this app for at least five days. 
            // Otherwise, this might be a little weird.
            if (firstLog && DateTime.now().startOf("day").minus({ days: 5 }).toMillis() > firstLog.timestamp) {
                const lastWeekInReview = (await get(ref(db, `/${user.uid}/lastWeekInReview`))).val();
                // Datetime we trigger the notification at
                let triggerDate;
                if (lastWeekInReview) {
                    // The next week in review is calculated by taking the last week
                    // in review, adding six days, and then going to the Friday of that week
                    // (start of week + 4 to friday) after noon.
                    triggerDate = DateTime.fromMillis(lastWeekInReview)
                        .plus({ days: 6 })
                        .startOf("week").plus({ days: 4 })
                        .startOf("day").plus({ hours: 12 });
                } else {
                    // If our first mood log was over 5 days ago
                    // and we've never done a week in review before,
                    // let's trigger it (starting after noon).
                    triggerDate = DateTime.fromMillis(firstLog.timestamp).startOf("day").plus({ hours: 12 });
                }

                // If we're after the trigger date,
                // it's go time!
                setShow(triggerDate < DateTime.now());
            }
        })();
    }, [user]);

    useEffect(() => {
        if (!user || !show) return;
        (async () => {
            const platform = Capacitor.getPlatform();
            let data: AnyMap = {
                offset: DateTime.now().offset,
                platform
            };

            try {
                if (platform !== "web") {
                    const token = await FirebaseMessaging.getToken();
                    data["fcmToken"] = token.token;
                    data["deviceId"] = (await Device.getId()).identifier;
                }
            } catch (e) {
                Sentry.captureException(e, { extra: { handled: true } });
            }
            await makeRequest("accounts/sync", user, data, undefined, true);
        })();
    }, [user, show]);

    return <>
        { show && <div className="prompt-overlay">
            <div className="container prompt-container">
                <div className="prompt-prompt">
                    <div className="title">Week In Review!</div>
                    <p className="text-center">Take a minute to answer a few questions about your mental health and get an overview of how you felt this week.</p>
                    <div onClick={() => {
                        localStorage.setItem("wirtoken", "wirtoken");
                        history.push("/review");
                    }} className="finish-button">Start</div>
                    <div className="wir-skip-buttons">
                        <div onClick={() => {setShow(false)}} className="finish-button secondary">Remind Me Later</div>
                        { skipWIR && <div onClick={skipWeek} className="finish-button secondary">Skip This Week</div> }
                    </div>
                </div>
            </div>
        </div> }
    </>
};

export default PromptWeekInReview;