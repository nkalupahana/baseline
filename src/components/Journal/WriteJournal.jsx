import "./JournalComponents.css";
import { useEffect, useRef } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import KeyboardSpacer from "../KeyboardSpacer";
import { decrypt, encrypt } from "../../helpers";

const WriteJournal = ({ setMoodRead, moodWrite, setText, ...props }) => {
    const textarea = useRef();
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (localStorage.getItem("eautosave")) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) setText(decrypt(localStorage.getItem("eautosave"), pwd));
        } else {
            const autosave = localStorage.getItem("autosave");
            if (autosave) {
                setText(autosave);
            }
        }

        textarea.current?.focus();
    }, [setText]);

    useEffect(() => {
        if (sessionStorage.getItem("pwd")) {
            localStorage.setItem("eautosave", encrypt(props.text, sessionStorage.getItem("pwd")));
        } else {
            localStorage.setItem("autosave", props.text);
        }
    }, [props.text]);

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">What's happening?</div>
                <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                <label data-value={props.text} className="input-sizer stacked">
                    <textarea ref={textarea} className="tx" value={props.text} onInput={e => setText(e.target.value)} rows="1" placeholder="Start typing here!"></textarea>
                </label>
                { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
                <KeyboardSpacer />
                <br />
            </div>
        </div>
    );
};

export default WriteJournal;
