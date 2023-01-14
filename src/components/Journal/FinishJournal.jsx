import "./JournalComponents.css";
import CircularSlider from "@nkalupahana/react-circular-slider";
import { IonSegment, IonSegmentButton, IonLabel, IonTextarea, IonSpinner, IonIcon } from "@ionic/react";
import { getIdToken } from "@firebase/auth";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";
import history from "../../history";
import { attach, closeOutline, trashOutline } from "ionicons/icons";
import { LocalNotifications } from "@getbaseline/capacitor-local-notifications";
import { Route } from "react-router";
import Negative5 from "./Negative5";
import { BASE_URL, checkKeys, networkFailure, parseSettings, toast } from "../../helpers";
import ldb from "../../db";
import { RateApp } from "capacitor-rate-app";
import Confetti from "react-confetti";
import Dialog, { checkPromptAllowed } from "../Dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { Dialogs } from "./JournalTypes";

const FinishJournal = props => {
    const [user] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [dialog, setDialog] = useState(undefined);
    const lastLogs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().limit(5).toArray());
    const lastAverageLogs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().filter(x => x.average === "average").limit(10).toArray());

    const dismissDialog = () => {
        setDialog(undefined);
    };

    useEffect(() => {
        // Refresh ID token in the background to speed up submission
        if (!user) return;
        getIdToken(user);
    }, [user]);

    
    useEffect(() => {
        if (!lastLogs || !lastAverageLogs) return;
        
        const settings = parseSettings();
        if (settings["beginner"]) {
            const lastLog = lastLogs.length > 0 ? lastLogs[lastLogs.length - 1] : undefined;

            // Check if user hasn't written in a while -- beginner (standard) mode
            // Based on last log and this one, if both have < 100 characters, show
            let writtenAnything = props.text.length >= 100;
            if (!writtenAnything && lastLog) writtenAnything = (lastLog.journal?.length >= 100 || lastLog.ejournal?.length >= 344);

            if (!writtenAnything && lastLog && checkPromptAllowed("noWritingBeginner", 1)) {
                setDialog(Dialogs.NO_WRITING_BEGINNER);
                return;
            }
        } else {
            // Check if user hasn't written in a while
            // Based on last five logs:
            // - If they have less than 5, as long as they have at least two, just go off of that
            // - If none of the last 2 - 5 or this one have text, show
            let writtenAnything = props.text.length > 50;
            for (let i = 0; (i < lastLogs.length && !writtenAnything); ++i) {
                writtenAnything = (lastLogs[i].journal?.length > 50 || lastLogs[i].ejournal?.length > 278);
            }

            if (!writtenAnything && lastLogs.length > 1 && checkPromptAllowed("noWriting", 5)) {
                setDialog(Dialogs.NO_WRITING);
                return;
            }
        }
        
        // Check if user's scale is shifted 
        // Get last ten logs marked average (if less than ten, ignore)
        // If their average is above 2.5, show
        if (lastAverageLogs.length === 10) {
            const average = lastAverageLogs.reduce((acc, log) => acc + log.mood, 0) / lastAverageLogs.length;
            if (average > 2.5 && checkPromptAllowed("scaleShifted", 7)) {
                setDialog(Dialogs.SCALE_SHIFTED);
                return;
            }
        }

    }, [lastLogs, lastAverageLogs, props.text]);

    useEffect(() => {
        if (submitted) {
            localStorage.removeItem("autosave");
            localStorage.removeItem("eautosave");
            if (!history.location.pathname.includes("/neg")) history.push("/summary#update");
        }
    }, [submitted]);

    const submit = async () => {
        if (submitting) return;
        if (props.moodWrite === -5) history.push("/journal/finish/neg");
        if (!user) {
            toast("No internet connectivity -- please try again.");
            return;
        }
        setSubmitting(true);

        let data = new FormData();
        data.append("timezone", DateTime.local().zoneName);
        data.append("mood", props.moodWrite);
        data.append("journal", props.text);
        data.append("average", props.average);
        data.append("keys", JSON.stringify(checkKeys()));
        for (let file of props.files) {
            data.append("file", file);
        }

        let response = undefined;
        try {
            response = await fetch(`${BASE_URL}/moodLog`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${await getIdToken(user)}`,
                },
                body: data
            });
        } catch (e) {
            if (networkFailure(e.message)) {
                toast(`We can't reach our servers. Check your internet connection and try again.${props.files.length > 0 ? " Your images might also be too big." : ""}`);
            } else {
                toast(`Something went wrong, please try again! \nError: ${e.message}`);
            }
            setSubmitting(false);
            return;
        }

        if (response) {
            if (response.ok) {
                if (Capacitor.getPlatform() !== "web") {
                    LocalNotifications.removeAllDeliveredNotifications();
                    ldb.logs.count().then(count => {
                        if (count > 10 && props.average === "above") RateApp.requestReview();
                    });
                }
                toast("Mood log saved!", "bottom");
                // Delay for some confetti!
                if (props.moodWrite === 5) await new Promise(res => setTimeout(res, 700));
                setSubmitted(true);
            } else {
                toast(`Something went wrong, please try again! \nError: ${await response.text()}`);
                setSubmitting(false);
            }
        } else {
            toast(`Something went wrong, please try again!`);
            setSubmitting(false);
        }
    };

    const fileDesc = file => {
        return file.name + file.lastModified + file.size;
    }

    const beginAttachFiles = () => {
        window.location.hash = "#attach";
    }

    const attachFiles = () => {
        const fileEl = document.getElementById("files");
        if (fileEl.files.length === 0) return;
        let newFiles = [...props.files];
        for (let f of fileEl.files) {
            if (newFiles.filter(file => fileDesc(file) === fileDesc(f)).length === 0) newFiles.push(f);
            if (newFiles.length > 3) newFiles.shift();
        }

        props.setFiles(newFiles);
        fileEl.value = "";
        // Temporary fix for iOS photo picker with PDP
        setTimeout(() => {
            window.location.hash = "";
        }, 1000);
    }

    const truncate = str => {
        if (str.length > 40) return str.substring(0, 15) + " ... " + str.substring(str.length - 25);
        return str;
    }

    const removeFile = desc => {
        if (submitting) return;
        props.setFiles(props.files.filter(file => fileDesc(file) !== desc));
    }

    return (
        <div className="outer-noscroll">
            { dialog === Dialogs.NO_WRITING && <Dialog title="One second!">
                <p className="margin-top-12 margin-bottom-24 text-center">
                    We noticed you haven't written much (or at all) in a while. Journaling works 
                    best when you take some time to really write and reflect about what you're going through.
                    It'll help you understand yourself better, and it'll definitely make your 
                    mood ratings more accurate. Try writing some more now!
                </p>
                <div className="finish-button" onClick={() => history.replace("/journal")}>Go back and write!</div>
                <div className="finish-button secondary" onClick={dismissDialog}>Not now.</div>
            </Dialog> }
            { dialog === Dialogs.SCALE_SHIFTED && <Dialog title="Before you continue!">
                <p className="margin-top-12 margin-bottom-24 text-center">
                    We've noticed that you're rating a lot of your "average" journal entries
                    with high scores (3+). If you're forgetting to select below/above
                    average, then this is an easy fix. But otherwise, it might be a sign that
                    you're not considering your full emotional range. Before rating your mood today,
                    take a few minutes to think about your life, from the very worst you've felt to the very best. 
                    Then, try to contextualize how you feel right now in that full range. Your scale is, of course,
                    you own, but "average" journal entries should generally be clustered around 0.
                </p>
                <div className="finish-button" onClick={dismissDialog}>Sounds good!</div>
                <br />
            </Dialog> }
            { dialog === Dialogs.NO_WRITING_BEGINNER && <Dialog title="One second!">
                <p className="margin-top-12 margin-bottom-24 text-center">
                    We noticed you haven't written much in your last few 
                    journal entries. Make sure you're writing about <b>what 
                    you've been doing, how you've been feeling, and why you 
                    might be feeling that way</b>. By doing this and writing more,
                    you'll get more out of journaling, and you'll have more 
                    context when you look back on your entries later!
                    <br /><br />
                    For more tips, check out our <span onClick={() => history.push("/onboarding/howto")} className="fake-link">How to 
                    Journal guide now</span> or later in the main menu.
                </p>
                <div className="finish-button" onClick={() => history.replace("/journal")}>Go back and write!</div>
                <div className="finish-button secondary" onClick={dismissDialog}>Not now.</div>
            </Dialog> }
            { props.moodWrite === 5 && submitting && <Confetti gravity={0.5} /> }
            <div className="container">
                <div className="inner-scroll">
                    <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
                    <div className="center-journal">
                        <Route exact path="/journal/finish">
                            <div className="title">
                                Let's summarize.
                            </div>
                            <p className="line1 text-center">On a scale from -5 to 5, how are you?</p>
                            <p className="line2 text-center">Try not to think too hard about this — just give your gut instinct.</p>
                            <br />
                            <span className="bold">
                                <CircularSlider
                                    width={190}
                                    label="nice find!"
                                    labelFontSize={0}
                                    valueFontSize="4rem"
                                    labelColor="var(--circular-slider-label)"
                                    knobColor="var(--circular-slider-knob)"
                                    progressColorFrom="#1c88e3"
                                    progressColorTo="#1975e6"
                                    progressSize={20}
                                    trackColor="var(--circular-slider-track)"
                                    trackSize={20}
                                    min={-5}
                                    max={5}
                                    direction={-1}
                                    dataIndex={props.moodRead + 5}
                                    animateKnob={false}
                                    knobDraggable={!submitting}
                                    verticalOffset="0.2em"
                                    onChange={ v => props.setMoodWrite(v) }
                                />
                            </span>

                            <br /><br />

                            <p style={{"fontWeight": "normal", "marginTop": "0px"}} className="text-center">And would you say that you're feeling:</p>
                            <div className="container">
                                <IonSegment mode="ios" value={props.average} onIonChange={e => props.setAverage(e.detail.value)} disabled={submitting}>
                                    <IonSegmentButton value="below">
                                        <IonLabel>Below Average</IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton value="average">
                                        <IonLabel>Average</IonLabel>
                                    </IonSegmentButton>
                                    <IonSegmentButton value="above">
                                        <IonLabel>Above Average</IonLabel>
                                    </IonSegmentButton>
                                </IonSegment>
                            </div>
                            <br /><br />
                            { props.files.map(file => <span key={fileDesc(file)} style={{"textAlign": "center"}}><IonIcon onClick={() => {removeFile(fileDesc(file))}} style={{"fontSize": "18px", "transform": "translateY(3px)"}} icon={trashOutline}></IonIcon> {truncate(file.name)}</span>)}
                            { props.files.length < 3 && 
                                <>
                                    <label htmlFor="files">
                                        <IonIcon icon={attach} style={{"fontSize": "25px", "transform": "translateY(6px)"}}></IonIcon>Attach A Photo ({3 - props.files.length} left)
                                    </label>
                                    <input onClick={beginAttachFiles} disabled={submitting} id="files" type="file" multiple accept="image/*" onChange={attachFiles} />
                                </>
                            }
                            <div style={{"height": "200px"}}></div>
                            <div className="bottom-bar">
                                <IonTextarea readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log -- tap to add" onClick={() => { if (!submitting) history.replace("/journal") }} />
                                <div onClick={submit} className="finish-button">
                                    { !submitting && "Done!" }
                                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                                </div>
                            </div>
                        </Route>
                        <Route exact path="/journal/finish/neg">
                            <div className="container-desktop">
                                <Negative5 />
                                <br />
                                { !submitted && props.moodWrite === -5 && <div onClick={submit} className="finish-button">
                                    { !submitting && "Save Mood Log" }
                                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                                </div> }
                                <br />
                            </div>
                        </Route>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinishJournal;
