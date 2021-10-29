import { withRouter } from "react-router-dom";
import "./JournalComponents.css";
import CircularSlider from "@nkalupahana/react-circular-slider";
import { IonSegment, IonSegmentButton, IonLabel, IonTextarea } from "@ionic/react";
import { getIdToken } from "@firebase/auth";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useState } from "react";
import { useIonToast } from "@ionic/react";
import { DateTime } from "luxon";
import { Capacitor } from "@capacitor/core";

const FinishJournal = withRouter((props) => {
    const [user, loading, error] = useAuthState(auth);
    const [submitting, setSubmitting] = useState(false);
    const [present, dismiss] = useIonToast();
    const BOTTOM_BAR_HEIGHT = 140;
    const [scheduled, setScheduled] = useState(false);
    const [bottomBarStyle, setBottomBarStyle] = useState({
        height: BOTTOM_BAR_HEIGHT + "px",
        bottom: "0px"
    });

    const errorToast = message => {
        present({
            message: `Something went wrong, please try again! Error: ${message}`,
            position: "top",
            duration: 3000
        });
    };

    const submit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const token = await getIdToken(user);
        const response = await fetch("https://us-central1-moody-ionic.cloudfunctions.net/moodLog",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    timezone: DateTime.local().zoneName,
                    mood: props.moodWrite,
                    journal: props.text,
                    average: props.average
                }),
            }
        ).catch(e => {
            errorToast(e.message);
            setSubmitting(false);
        });

        if (response) {
            if (response.ok) {
                present({
                    message: `Mood log saved!`,
                    position: "top",
                    duration: 3000
                });
                props.history.push("/summary");
            } else {
                errorToast(await response.text());
                setSubmitting(false);
            }
        }
    };

    if (Capacitor.getPlatform() === 'ios' && !scheduled) {
        setBottomBarStyle({
            height: BOTTOM_BAR_HEIGHT + "px",
            top: window.screen.height - BOTTOM_BAR_HEIGHT + "px"
        });

        setTimeout(() => {
            console.log("timeout");
            setBottomBarStyle({
                height: BOTTOM_BAR_HEIGHT + "px",
                bottom: "0px"
            });
        }, 1000);

        setScheduled(true);
    }

    return (
        <div className="center-main">
            <div className="title">
                Let's summarize.
            </div>
            <p className="text-center">On a scale from -5 to 5, how are you?</p>
            <br />
            <CircularSlider
                width={230}
                label="nice find!"
                labelFontSize={0}
                valueFontSize="5rem"
                labelColor="#005a58"
                knobColor="#005a58"
                progressColorFrom="#c8e6c9"
                progressColorTo="#388e3c"
                progressSize={24}
                trackColor="#eeeeee"
                trackSize={24}
                min={-5}
                max={5}
                direction={-1}
                dataIndex={props.moodRead + 5}
                animateKnob={false}
                verticalOffset="0.2em"
                onChange={ v => props.setMoodWrite(v) }
            />

            <br /><br />

            <p className="text-center">And finally, would you say that you're feeling:</p>
            <div className="container">
                <IonSegment mode="ios" value={props.average} onIonChange={e => props.setAverage(e.detail.value)}>
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
            <br /><br /><br /><br /><br /><br /><br /><br /><br />
            <div style={bottomBarStyle} className="bottom-bar">
                <IonTextarea readonly rows={2} className="tx tx-display" value={props.text} placeholder="No mood log -- tap to add" onIonFocus={() => { if (!submitting) props.history.goBack() }} />
                <div onClick={submit} className="finish-button">
                    { !submitting && "Done!" }
                    { submitting && <div className="loader"></div> }</div>
            </div>
        </div>
    );
});

export default FinishJournal;
