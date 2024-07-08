import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
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

const TOP_LIMIT = 150;

const WriteJournal = ({ text, setText, next, setAudioView, editTimestamp } : Props) => {
    const textarea = useRef<HTMLTextAreaElement>(null);
    const [spos, setSpos] = useState(0);
    const keyboardHeight = useRef(0);
    const cursor = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (!textarea.current) return;
            textarea.current.focus();
        })
    }, []);

    const onTxEvent = useCallback((e: SyntheticEvent<HTMLTextAreaElement>) => {
        setText(e.currentTarget.value);
        setSpos(e.currentTarget.selectionStart);
        
        requestAnimationFrame(() => {
            const cursorRelPos = cursor.current?.offsetTop || 0;
            const textareaAbsPos = textarea.current?.getBoundingClientRect().top || 0;

            const cursorAbsPos = cursorRelPos + textareaAbsPos;
            const BOTTOM_LIMIT = window.innerHeight - 100 - (keyboardHeight.current || 100);
            console.log(TOP_LIMIT, cursorAbsPos, BOTTOM_LIMIT);
            if (cursorAbsPos > BOTTOM_LIMIT) {
                document.querySelector(".page")?.scrollBy({
                    top: cursorAbsPos - BOTTOM_LIMIT + 25,
                    behavior: "smooth"
                });
            } else if (cursorAbsPos < TOP_LIMIT) {
                document.querySelector(".page")?.scrollBy({
                    top: cursorAbsPos - TOP_LIMIT,
                    behavior: "smooth"
                });
            }
        });
    }, [setText]);

    return <>
        <label data-value={text} className="input-sizer stacked">
            <textarea ref={textarea} className="tx" value={text} onInput={onTxEvent} onFocus={onTxEvent} rows={1} placeholder="Start typing here!"></textarea>
        </label>
        <div className="container jc-faked-container">
            <div className="center-journal">
                <div className="input-sizer stacked jc-faked-input">
                    <div className="tx">
                        { text.substring(0, spos) }
                        <span ref={cursor}>{ text.substring(spos) || "‎" }</span>
                    </div>
                </div>
            </div>
        </div>
        { !text.trim() && !editTimestamp && <p onClick={() => setAudioView(true)} className="input-sizer sizing-only rj-switch">
            <IonIcon icon={mic} className="rj-switch-icon" />
            <span style={{"paddingLeft": "1.5px"}}>Switch to Audio Journal</span>
        </p> }
        { text.trim() && <div onClick={next} className="fake-button">Continue</div> }
        <KeyboardSpacer externalRef={keyboardHeight} />
        <div className="br"></div>
    </>
};

export default WriteJournal;