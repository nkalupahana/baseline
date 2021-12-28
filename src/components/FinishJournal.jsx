import "./JournalComponents.css";
import CircularSlider from "@nkalupahana/react-circular-slider";
import { IonSegment, IonSegmentButton, IonLabel, IonTextarea, IonSpinner } from "@ionic/react";
import { getIdToken } from "@firebase/auth";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";
import { useIonToast } from "@ionic/react";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";
import history from "../history";

const FinishJournal = props => {
    const [user, loading] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [files, setFiles] = useState([]);
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
        for (let file of files) {
            data.append("file", file);
        }

        const response = await fetch("https://us-central1-moody-ionic.cloudfunctions.net/moodLogNext",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data
            }
        ).catch(e => {
            if (e.message === "Load failed") {
                toast(`We can't reach our servers. Check your internet connection and try again.`);
            } else {
                toast(`Something went wrong, please try again! \nError: ${e.message}`);
            }
            errored = true;
            setSubmitting(false);
        });

        if (response) {
            if (response.ok) {
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

    const attachFiles = () => {
        const fileEl = document.getElementById("files");
        if (fileEl.files.length == 0) return;
        let newFiles = [...files];
        for (let f of fileEl.files) {
            if (newFiles.filter(file => file.name === f.name).length === 0) newFiles.push(f);
            if (newFiles.length > 3) newFiles.shift();
        }

        setFiles(newFiles);
        fileEl.value = "";
    }

    return (
        <div className="center-journal">
            <div className="title">
                Let's summarize.
            </div>
            <p className="line1 text-center">On a scale from -5 to 5, how are you?</p>
            <p className="line2 text-center">Try not to think too hard about this — just give your gut instinct.</p>
            <br />
            <CircularSlider
                width={230}
                label="nice find!"
                labelFontSize={0}
                valueFontSize="5rem"
                labelColor="#020856"
                knobColor="#020856"
                progressColorFrom="#1c88e3"
                progressColorTo="#1975e6"
                progressSize={24}
                trackColor="#eeeeee"
                trackSize={24}
                min={-5}
                max={5}
                direction={-1}
                dataIndex={props.moodRead + 5}
                animateKnob={false}
                knobDraggable={!submitting}
                verticalOffset="0.2em"
                onChange={ v => props.setMoodWrite(v) }
            />

            <br /><br />

            <p className="text-center">And finally, would you say that you're feeling:</p>
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
            { files.map(file => <p key={file.name}>{file.name}</p>)}
            { files.length < 3 && <input id="files" type="file" multiple accept="image/*" onChange={attachFiles} /> }
            <br /><br /><br /><br /><br /><br />
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
