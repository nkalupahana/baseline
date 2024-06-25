import { useEffect, useRef } from "react";
import KeyboardSpacer from "../KeyboardSpacer";
import { IonIcon } from "@ionic/react";
import { mic } from "ionicons/icons";

interface Props {
    text: string;
    setText: (text: string) => void;
    next: () => void;
    setAudioView: (view: boolean) => void;
    editTimestamp: number | null;
}

const WriteJournal = ({ text, setText, next, setAudioView, editTimestamp } : Props) => {
    const textarea = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!textarea.current) return;
        textarea.current.focus();
    }, []);


    return <>
        <label data-value={text} className="input-sizer stacked">
            <textarea ref={textarea} className="tx" value={text} onInput={e => setText((e.target as HTMLTextAreaElement).value)} rows={1} placeholder="Start typing here!"></textarea>
        </label>
        { !text.trim() && !editTimestamp && <p onClick={() => setAudioView(true)} className="input-sizer sizing-only rj-switch">
            <IonIcon icon={mic} className="rj-switch-icon" />
            <span style={{"paddingLeft": "1.5px"}}>Switch to Audio Journal</span>
        </p> }
        { text.trim() && <div onClick={next} className="fake-button">Continue</div> }
        <KeyboardSpacer />
        <div className="br"></div>
    </>
};

export default WriteJournal;