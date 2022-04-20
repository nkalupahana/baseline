import "./JournalComponents.css";
import CircularSlider from "@nkalupahana/react-circular-slider";
import { IonSegment, IonSegmentButton, IonLabel, IonTextarea, IonSpinner, IonIcon } from "@ionic/react";
import { getIdToken } from "@firebase/auth";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { useIonToast } from "@ionic/react";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";
import history from "../../history";
import { attach, trashOutline } from "ionicons/icons";
import { LocalNotifications } from "@moody-app/capacitor-local-notifications";
import { Route, Switch } from "react-router";
import EndSpacer from "../EndSpacer";

const FinishJournal = props => {
    const [user, loading] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [present] = useIonToast();
    const BOTTOM_BAR_HEIGHT = 148;
    const [bottomBarStyle, setBottomBarStyle] = useState({
        height: BOTTOM_BAR_HEIGHT + "px",
        bottom: "0px"
    });

    const toast = message => {
        present({
            message,
            position: "top",
            duration: 3000
        });
    };

    useEffect(() => {
        if (submitted && !history.location.pathname.includes("/neg")) {
            history.push("/summary");
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

        const token = await getIdToken(user);
        let errored = false;

        var data = new FormData();
        data.append("timezone", DateTime.local().zoneName);
        data.append("mood", props.moodWrite);
        data.append("journal", props.text);
        data.append("average", props.average);
        for (let file of props.files) {
            data.append("file", file);
        }

        const response = await fetch("https://us-central1-moody-ionic.cloudfunctions.net/moodLog",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data
            }
        ).catch(e => {
            if (e.message === "Load failed") {
                toast(`We can't reach our servers. Check your internet connection and try again.${props.files.length > 0 ? " Your images might also be too big." : ""}`);
            } else {
                toast(`Something went wrong, please try again! \nError: ${e.message}`);
            }
            errored = true;
            setSubmitting(false);
        });

        if (response) {
            if (response.ok) {
                if (Capacitor.getPlatform() !== "web") LocalNotifications.clearDeliveredNotifications();
                present({
                    message: `Mood log saved!`,
                    position: "bottom",
                    duration: 3000
                });
                setSubmitted(true);
            } else {
                if (!errored) toast(`Something went wrong, please try again! \nError: ${await response.text()}`);
                setSubmitting(false);
            }
        } else {
            if (!errored) toast(`Something went wrong, please try again!`);
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (Capacitor.getPlatform() === 'ios') {
            setBottomBarStyle({
                height: BOTTOM_BAR_HEIGHT + "px",
                top: window.screen.height - BOTTOM_BAR_HEIGHT + "px"
            });
    
            setTimeout(() => {
                setBottomBarStyle({
                    height: BOTTOM_BAR_HEIGHT + "px",
                    bottom: "0px"
                });
            }, 1000);
        }
    }, []);

    const fileDesc = file => {
        return file.name + file.lastModified + file.size;
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
        <div className="center-journal">
            <Switch>
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
                            <input disabled={submitting} id="files" type="file" multiple accept="image/*" onChange={attachFiles} />
                        </> 
                    }
                    <div style={bottomBarStyle} className="bottom-bar">
                        <IonTextarea readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log -- tap to add" onIonFocus={() => { if (!submitting) history.goBack() }} />
                        <div onClick={submit} className="finish-button">
                            { !submitting && "Done!" }
                            { submitting && <IonSpinner className="loader" name="crescent" /> }
                        </div>
                    </div>
                </Route>
                <Route exact path="/journal/finish/neg">
                    <div className="container-desktop">
                        <div className="title">
                            Hi there.
                        </div>
                        <p className="text-center">We know things probably seem pretty bad right now. We wanted to take a minute to offer you some hope and support. If you can, 
                            take a minute to breathe and read through this. We're here for you.</p>
                        <p className="text-center">When you're going through hard times, it's important to talk to someone about how you feel. Mood logging is already a great start. If you have 
                            someone in your life that you trust to talk about what you're going through, reach out to them. We know it's hard, but it's almost always worth it.
                            If what you're going through involves those people, you can also talk with someone on a site like <a target="_blank" rel="noreferrer" href="https://7cups.com">7 Cups</a>, 
                            a free and confidential emotional support community with trained listeners.</p>
                        <p className="text-center">If you're currently in crisis, you should seek support as soon as you can. Here are some resources:</p>
                        <p className="text-center">National Suicide Prevention Lifeline: <br /><a href="tel:988" target="_blank" rel="noreferrer">Call</a> or <a href="sms:988" target="_blank" rel="noreferrer">Text</a> 988, or <a target="_blank" rel="noreferrer" href="https://suicidepreventionlifeline.org/chat/">Online Chat</a></p>
                        <p className="text-center">Trevor Line for LGBTQ+ Youth: <br /><a href="tel:1-866-488-7386" target="_blank" rel="noreferrer">Call</a> or <a href="sms:678678" target="_blank" rel="noreferrer">Text</a>, or <a href="https://trevorproject.secure.force.com/apex/TrevorChatPreChatForm" target="_blank" rel="noreferrer">Online Chat</a></p>
                        <p className="text-center"><a href="https://www.apa.org/topics/crisis-hotlines" target="_blank" rel="noreferrer">Other Specialized Hotlines (drugs/assault/abuse/etc.)</a></p>
                        <p className="text-center">We also can't recommend therapy enough as a way to process your feelings and find ways to solve problems in your life. If you have health insurance, you can likely get therapy for cheap. 
                            Check with your insurance provider, and <a href="https://www.apa.org/topics/crisis-hotlines" target="_blank" rel="noreferrer">search for specialists here!</a> If you don't have insurance or aren't sure how to find a covered therapist (or if you need help finding any other resources!), 
                            email us at <a href="mailto:findhelp@domain" target="_blank" rel="noreferrer">findhelp@domain</a> -- we'd be happy to help.
                        </p>
                        <p className="text-center">If you're struggling with money and it's negatively impacting your mental health, you can apply for financial assistance from the moody Gap Fund.
                            The gap fund exists to help you "fill in the gaps" in your financial situation, and can be used for pretty much anything, from funding for therapy to transportation to basic necessities like food and shelter.&nbsp;
                            <span style={{color: "var(--ion-color-primary, #3880ff)"}} onClick={() => {history.push("/gap")}}>You can apply now by clicking here, or any time from the menu on the summary page.</span>
                        </p>
                        { !submitted && props.moodWrite === -5 && <div onClick={submit} className="finish-button">
                            { !submitting && "Save Mood Log" }
                            { submitting && <IonSpinner className="loader" name="crescent" /> }
                        </div> }
                    </div>
                </Route>
            </Switch>
            <EndSpacer />
        </div>
    );
};

export default FinishJournal;
