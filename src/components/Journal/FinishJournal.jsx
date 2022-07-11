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
import { LocalNotifications } from "@moody-app/capacitor-local-notifications";
import { Route } from "react-router";
import Negative5 from "./Negative5";
import { checkKeys, networkFailure, toast } from "../../helpers";

const FinishJournal = props => {
    const [user, loading] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

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
        if (loading) {
            toast("No internet connectivity -- please try again.");
            return;
        }
        setSubmitting(true);

        var data = new FormData();
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
            response = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/moodLog", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${await getIdToken(user)}`,
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
                if (Capacitor.getPlatform() !== "web") LocalNotifications.clearDeliveredNotifications();
                toast("Mood log saved!", "bottom");
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
                                    labelColor="#020856"
                                    knobColor="#020856"
                                    progressColorFrom="#1c88e3"
                                    progressColorTo="#1975e6"
                                    progressSize={20}
                                    trackColor="#eeeeee"
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
                                <IonTextarea readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log -- tap to add" onIonFocus={() => { if (!submitting) history.goBack() }} />
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
