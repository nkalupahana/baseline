import "./JournalComponents.css";
import { useEffect, useRef } from "react";
import history from "../../history";
import { signOutAndCleanUp } from "../../firebase";

const WriteJournal = ({ setMoodRead, moodWrite, ...props }) => {
    const textarea = useRef();
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (textarea.current) textarea.current.focus();
    }, []);

    return (
        <div className="center-journal">
            <div className="title" onClick={signOutAndCleanUp}>What's happening?</div>
            <p className="text-center bold" onClick={next}>If you don't want to write right now, tap here to jump to mood logging.</p>
            <label data-value={props.text} className="input-sizer stacked">
                <textarea ref={textarea} className="tx" value={props.text} onInput={e => props.setText(e.target.value)} rows="1" placeholder="Start typing here!"></textarea>
            </label>
            <br />
            { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
            <br />
        </div>
    );
};

export default WriteJournal;
