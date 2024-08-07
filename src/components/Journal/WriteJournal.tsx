import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import KeyboardSpacer from "../KeyboardSpacer";
import { IonIcon } from "@ionic/react";
import { mic } from "ionicons/icons";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import * as Sentry from "@sentry/react";

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
    const startingText = useRef(text);
    const noscrollExceptionCaptured = useRef(false);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (!textarea.current) return;
            textarea.current.focus({ preventScroll: true });
            if (startingText.current.length > 0) {
                textarea.current.selectionStart = startingText.current.length;
                textarea.current.selectionEnd = startingText.current.length;
                setSpos(startingText.current.length);
            }

            // Quirk: Android doesn't show the keyboard
            // on first focus, so we have to manually show it
            if (Capacitor.getPlatform() === "android") {
                Keyboard.show();
            }
        });
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

            const BOTTOM_LIMIT = window.innerHeight - 100 - (keyboardHeight || 100);
    
            if (TOP_LIMIT > BOTTOM_LIMIT) {
                // Send exception to Sentry only once
                if (!noscrollExceptionCaptured.current) {
                    Sentry.captureException(
                        new Error(`Top limit greater than bottom limit, autoscroll disabled.`),
                        {
                            extra: {
                                TOP_LIMIT,
                                BOTTOM_LIMIT,
                                cursorRelPos,
                                textareaAbsPos,
                                cursorAbsPos,
                                spos,
                                keyboardHeight,
                                windowInnerHeight: window.innerHeight,
                                textareaBounds: textarea.current?.getBoundingClientRect(),
                                ua: navigator.userAgent
                            }
                        }
                    );
                    noscrollExceptionCaptured.current = true;
                }
                return;
            }
    
            const scrollBehavior = Capacitor.getPlatform() === "ios" ? "auto" : "smooth";
    
            if (cursorAbsPos > BOTTOM_LIMIT) {
                Sentry.addBreadcrumb({
                    message: `Autoscroll down ${cursorAbsPos - BOTTOM_LIMIT + 25}`,
                });

                document.querySelector(".page")?.scrollBy({
                    top: cursorAbsPos - BOTTOM_LIMIT + 25,
                    behavior: scrollBehavior
                });
            } else if (cursorAbsPos < TOP_LIMIT) {
                Sentry.addBreadcrumb({
                    message: `Autoscroll up ${cursorAbsPos - TOP_LIMIT}`,
                });

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