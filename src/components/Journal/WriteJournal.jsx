import "./JournalComponents.css";
import { IonTextarea } from "@ionic/react";
import { useEffect } from "react";
import history from "../../history";
import { signOutAndCleanUp } from "../../firebase";

const WriteJournal = ({ setMoodRead, moodWrite, ...props }) => {
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    return (
        <div className="center-journal">
            <div className="title" onClick={signOutAndCleanUp}>What's happening?</div>
            <p className="text-center bold" onClick={next}>If you don't want to write right now, tap here to jump to mood logging.</p>
            <IonTextarea autocapitalize="sentences" autofocus auto-grow={true} className="tx" value={props.text} placeholder="Start typing here!" onIonChange={e => props.setText(e.detail.value)}/>
            { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
            <br />
        </div>
    );
};

export default WriteJournal;
