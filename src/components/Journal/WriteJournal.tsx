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
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const cursor = useRef<HTMLSpanElement>(null);
    const smoothScrollStop = useRef(Date.now());
    const startingText = useRef(text);
    const prevCursorRelHeight = useRef<number | undefined>(undefined);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (!textarea.current) return;
            textarea.current.focus({ preventScroll: true });
            if (startingText.current.length > 0) {
                console.log("start run");
                textarea.current.selectionStart = startingText.current.length;
                textarea.current.selectionEnd = startingText.current.length;
                setSpos(startingText.current.length);
            }
        })
    }, []);

    const onTxEvent = useCallback((e: SyntheticEvent<HTMLTextAreaElement>) => {
        setText(e.currentTarget.value);
        setSpos(e.currentTarget.selectionStart);
    }, [setText]);

    useEffect(() => {
        requestAnimationFrame(() => {
            const cursorRelPos = cursor.current?.offsetTop || 0;
            const textareaAbsPos = textarea.current?.getBoundingClientRect().top || 0;
    
            const cursorAbsPos = cursorRelPos + textareaAbsPos;
            if (prevCursorRelHeight.current !== undefined && cursorRelPos < prevCursorRelHeight.current) {
                const difference = cursorRelPos - prevCursorRelHeight.current;
                console.log("scroll difference", difference);
                document.querySelector(".page")?.scrollBy({
                    top: difference,
                    behavior: "smooth"
                });
                prevCursorRelHeight.current = cursorRelPos;
                return;
            }
            
            prevCursorRelHeight.current = cursorRelPos;

            const BOTTOM_LIMIT = window.innerHeight - 100 - (keyboardHeight || 100);
    
            if (TOP_LIMIT > BOTTOM_LIMIT) {
                console.log("AAA");
                return;
            }
    
            const shouldSmoothScroll = Date.now() - smoothScrollStop.current > 2000;
            const scrollBehavior = shouldSmoothScroll ? "smooth" : "auto";
    
            if (cursorAbsPos > BOTTOM_LIMIT) {
                console.log("scroll down", cursorAbsPos - BOTTOM_LIMIT + 25);
                document.querySelector(".page")?.scrollBy({
                    top: cursorAbsPos - BOTTOM_LIMIT + 25,
                    behavior: scrollBehavior
                });
            } else if (cursorAbsPos < TOP_LIMIT) {
                console.log("scroll up", cursorAbsPos - TOP_LIMIT);
                document.querySelector(".page")?.scrollBy({
                    top: cursorAbsPos - TOP_LIMIT,
                    behavior: scrollBehavior
                });
            }
        })
    }, [text, spos, keyboardHeight]);

    return <>
        <label data-value={text} className="input-sizer stacked">
            <textarea ref={textarea} className="tx" value={text} onInput={onTxEvent} onFocus={onTxEvent} onClick={onTxEvent} rows={1} placeholder="Start typing here!"></textarea>
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
        <KeyboardSpacer externalSetter={setKeyboardHeight} />
        <div className="br"></div>
    </>
};

export default WriteJournal;