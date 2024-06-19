import "./JournalComponents.css";
import CircularSlider from "@nkalupahana/react-circular-slider";
import { IonSegment, IonSegmentButton, IonLabel, IonTextarea, IonSpinner, IonIcon } from "@ionic/react";
import { getIdToken } from "firebase/auth"
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";
import history from "../../history";
import { attach, closeCircleOutline, closeOutline } from "ionicons/icons";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Route } from "react-router";
import Negative5 from "./Negative5";
import { BASE_URL, checkKeys, networkFailure, toast } from "../../helpers";
import ldb from "../../db";
import { InAppReview } from '@capacitor-community/in-app-review';
import Confetti from "react-confetti";
import Dialog, { checkPromptAllowed } from "../Dialog";
import { useLiveQuery } from "dexie-react-hooks";
import { Dialogs } from "./JournalTypes";
import Joyride from "react-joyride";
import SearchSpotify from "./SearchSpotify";

const FinishJournal = props => {
    const [user] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [dialog, setDialog] = useState(undefined);
    const lastLogs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().limit(1).toArray());
    const lastAverageLogs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().filter(x => x.average === "average").limit(10).toArray());
    const [firstTimer, setFirstTimer] = useState(false);

    const dismissDialog = () => {
        setDialog(undefined);
    };

    useEffect(() => {
        // Refresh ID token in the background to speed up submission
        if (!user) return;
        getIdToken(user);
    }, [user]);

    // First-time user tour
    useEffect(() => {
        if (!lastLogs) return;
        if (lastLogs.length === 0) setFirstTimer(true);
    }, [lastLogs]);

    const steps = [
        {
            target: "#react-circular-slider",
            content: "Move the knob to rate your mood from -5 to 5.",
            disableBeacon: true,
            offset: 5,
        }, {
            target: "#average-segment-desc",
            content: `${Capacitor.getPlatform() === "web" ? 'Click' : 'Tap'} below to mark your average.`,
            disableBeacon: true,
            offset: 0,
            placement: "top"
        }, {
            target: "#review-textarea",
            content: `Journals can't be edited for long, so ${Capacitor.getPlatform() === "web" ? 'click' : 'tap'} below if you want to make any final edits. Otherwise, click done!`,
            disableBeacon: true,
            placement: "top-start",
            styles: {
                options: {
                    width: 300,
                    offset: -50
                }
            },
            floaterProps: {
                hideArrow: true
            }
        }
    ]
    
    useEffect(() => {
        if (!lastLogs || !lastAverageLogs || props.editTimestamp) return;
        const lastLog = lastLogs[0];
       
        // Check if user isn't writing enough
        // Based on last log and this one, if both have < 100 characters, show
        let writtenAnything = props.text.length >= 100;
        if (!writtenAnything && lastLog) writtenAnything = (lastLog.journal?.length >= 100 || lastLog.ejournal?.length >= 344);

        if (!writtenAnything && lastLog && checkPromptAllowed("noWriting", 2)) {
            setDialog(Dialogs.NO_WRITING);
            return;
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

    }, [lastLogs, lastAverageLogs, props.text, props.editTimestamp]);

    useEffect(() => {
        if (submitted) {
            localStorage.removeItem("autosave");
            localStorage.removeItem("eautosave");
            if (!history.location.pathname.includes("/neg")) history.push("/summary#update");
        }
    }, [submitted]);

    const submit = async () => {
        if (submitting) return;
        if (props.moodWrite === -5 && !props.editTimestamp) history.push("/journal/finish/neg");
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
        data.append("editTimestamp", props.editTimestamp);
        data.append("audio", props.audio);

        if (props.song) data.append("song", props.song.uri);
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
                        if (count > 8 && props.average === "above") InAppReview.requestReview();
                    });
                }
                if (props.editTimestamp) ldb.logs.delete(props.editTimestamp);
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
        <div className="outer-noscroll rss-backdrop">
            { firstTimer && <Joyride 
                locale={{last: "Close"}} 
                disableOverlay={true} 
                steps={steps} 
                continuous={true}
                hideCloseButton={true}
                styles={{
                    options: {
                        primaryColor: "var(--ion-color-primary)",
                        backgroundColor: "var(--ion-item-background)",
                        arrowColor: "var(--ion-item-background)",
                        textColor: "inherit",
                        width: 200,
                    },
                    tooltipContent: {
                        padding: "10px 10px 0 10px"
                    }
                }}
                floaterProps={{
                    styles: {
                        floater: {
                            filter: "var(--floater-shadow)",
                        }
                    }
                }}
            /> }
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
                <div className="br"></div>
            </Dialog> }
            { dialog === Dialogs.NO_WRITING && <Dialog title="One second!">
                <p className="margin-top-12 margin-bottom-24 text-center">
                    We noticed you haven't written much in your last few 
                    journal entries. Make sure you're writing about <b>what 
                    you've been doing, how you've been feeling, and why you 
                    might be feeling that way</b>. By doing this and writing more,
                    you'll get more out of journaling, and you'll have more 
                    context when you look back on your entries later!
                    <div className="br"></div><div className="br"></div>
                    For more tips, check out our <span onClick={() => history.push("/onboarding/howto")} className="fake-link">How to 
                    Journal guide now</span> or later in the main menu.
                </p>
                <div className="finish-button" onClick={() => history.replace("/journal")}>Go back and write!</div>
                <div className="finish-button secondary" onClick={dismissDialog}>Not now.</div>
            </Dialog> }
            { props.moodWrite === 5 && submitting && <Confetti gravity={0.5} /> }
            <div className="container">
                <div className="inner-scroll">
                    <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
                    <div className="center-journal">
                        <Route exact path="/journal/finish">
                            <div className="title">
                                Let's summarize.
                            </div>
                            <p className="line1 text-center">On a scale from -5 to 5, how are you?</p>
                            <p className="line2 text-center">Try not to think too hard about this — just give your gut instinct.</p>
                            <div className="br"></div>
                            <span className="bold" id="react-circular-slider">
                                <CircularSlider
                                    width={190}
                                    label="nice find!"
                                    labelFontSize={0}
                                    valueFontSize="4rem"
                                    labelColor="var(--circular-slider-label)"
                                    knobColor="var(--circular-slider-knob)"
                                    knobHighlightColor="var(--circular-slider-knob-highlight)"
                                    knobSize={40}
                                    progressColorFrom="#1c88e3"
                                    progressColorTo="#1975e6"
                                    progressSize={20}
                                    trackColor="var(--circular-slider-track)"
                                    trackSize={20}
                                    min={-5}
                                    max={5}
                                    direction={-1}
                                    dataIndex={props.moodRead + 5}
                                    animateKnob={firstTimer}
                                    knobDraggable={!submitting}
                                    verticalOffset="0.2em"
                                    onChange={ v => props.setMoodWrite(v) }
                                />
                            </span>

                            <div className="br"></div><div className="br"></div>

                            <p id="average-segment-desc" style={{"fontWeight": "normal", "marginTop": "0px"}} className="text-center">And would you say that you're feeling:</p>
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
                            <div className="br"></div><div className="br"></div>
                            { props.files.length < 3 && !props.editTimestamp &&
                                <>
                                    <label htmlFor="files" style={{"cursor": "pointer"}}>
                                        <IonIcon icon={attach} className="journal-additions-icon"></IonIcon>Attach A Photo ({3 - props.files.length} left)
                                    </label>
                                    <input onClick={beginAttachFiles} disabled={submitting} id="files" type="file" multiple accept="image/*" onChange={attachFiles} />
                                </>
                            }
                            { props.files.map(file => <span key={fileDesc(file)} style={{"textAlign": "center"}}>{truncate(file.name)} <IonIcon onClick={() => {removeFile(fileDesc(file))}} className="secondary-icon" icon={closeCircleOutline}></IonIcon></span>)}
                            { !props.editTimestamp && <SearchSpotify user={user} song={props.song} setSong={props.setSong} /> }
                            <div style={{"height": "200px"}}></div>
                            <div className="bottom-bar">
                                <IonTextarea id="review-textarea" readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log, tap to add" onClick={() => { if (!submitting) history.replace("/journal") }} />
                                <div onClick={submit} className="finish-button">
                                    { !submitting && props.editTimestamp === null && "Done!" }
                                    { !submitting && props.editTimestamp !== null && "Edit!" }
                                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                                </div>
                            </div>
                        </Route>
                        <Route exact path="/journal/finish/neg">
                            <div className="container-desktop">
                                <Negative5 />
                                <div className="br"></div>
                                { !submitted && props.moodWrite === -5 && <div onClick={submit} className="finish-button">
                                    { !submitting && "Save Mood Log" }
                                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                                </div> }
                                <div className="br"></div>
                            </div>
                        </Route>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinishJournal;
