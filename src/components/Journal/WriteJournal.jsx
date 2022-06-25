import "./JournalComponents.css";
import { useEffect, useState, useRef } from "react";
import history from "../../history";
import { signOutAndCleanUp } from "../../firebase";
import { Keyboard } from "@capacitor/keyboard";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";

const WriteJournal = ({ setMoodRead, moodWrite, ...props }) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const textarea = useRef();
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        textarea.current?.focus();
    }, []);

    useEffect(() => {
        const show = info => {
            setKeyboardHeight(info.keyboardHeight + 10);
        }
        
        const hide = () => {
            setKeyboardHeight(0);
        }

        Keyboard.addListener("keyboardDidShow", show);
        Keyboard.addListener("keyboardDidHide", hide);

        return () => {
            Keyboard.removeListener("keyboardDidShow", show);
            Keyboard.removeListener("keyboardDidHide", hide);
        };
    }, []);

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title" onClick={signOutAndCleanUp}>What's happening?</div>
                <p className="text-center bold" onClick={next}>If you don't want to write right now, tap here to jump to mood logging.</p>
                <label data-value={props.text} className="input-sizer stacked">
                    <textarea ref={textarea} className="tx" value={props.text} onInput={e => props.setText(e.target.value)} rows="1" placeholder="Start typing here!"></textarea>
                </label>
                { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
                <div style={{"height": `${keyboardHeight}px`, width: "100%"}}></div>
                <br />
            </div>
        </div>
    );
};

export default WriteJournal;
