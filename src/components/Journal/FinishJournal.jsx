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
import { LocalNotifications } from "capacitor-local-notifications";

const FinishJournal = props => {
    const [user, loading] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
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

    const submit = async () => {
        if (submitting) return;
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
                history.push("/summary");
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
            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
            <div style={bottomBarStyle} className="bottom-bar">
                <IonTextarea readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log -- tap to add" onIonFocus={() => { if (!submitting) history.goBack() }} />
                <div onClick={submit} className="finish-button">
                    { !submitting && "Done!" }
                    { submitting && <IonSpinner className="loader" name="crescent" /> }</div>
            </div>
        </div>
    );
};

export default FinishJournal;
