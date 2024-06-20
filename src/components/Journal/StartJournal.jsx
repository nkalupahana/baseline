import "./JournalComponents.css";
import { useEffect, useRef } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import KeyboardSpacer from "../KeyboardSpacer";
import { encrypt } from "../../helpers";
import RecordJournal from "./RecordJournal";

const StartJournal = ({ setMoodRead, moodWrite, setText, editTimestamp, ...props }) => {
    const textarea = useRef();
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (!textarea.current) return;
        textarea.current.focus();
    }, []);

    useEffect(() => {
        if (!props.text || editTimestamp) return;

        if (sessionStorage.getItem("pwd")) {
            localStorage.setItem("eautosave", encrypt(props.text, sessionStorage.getItem("pwd")));
        } else {
            localStorage.setItem("autosave", props.text);
        }
    }, [props.text, editTimestamp]);

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                { !editTimestamp && <>
                    <div className="title">What's happening?</div>
                    <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                </> }
                { !!editTimestamp && 
                    <>
                        <div className="title">Edit Journal</div> 
                        <div className="br"></div>
                    </>
                }
                <label data-value={props.text} className="input-sizer stacked">
                    <textarea ref={textarea} className="tx" value={props.text} onInput={e => setText(e.target.value)} rows="1" placeholder="Start typing here!"></textarea>
                </label>
                { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
                <KeyboardSpacer />
                <RecordJournal audioChunks={props.audioChunks} />
                <div className="br"></div>
            </div>
        </div>
    );
};

export default StartJournal;
