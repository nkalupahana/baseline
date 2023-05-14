import "./JournalComponents.css";
import { ClipboardEvent, FormEvent, useEffect, useRef } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import KeyboardSpacer from "../KeyboardSpacer";
import { decrypt, encrypt } from "../../helpers";
import rangy from "rangy";
import "rangy/lib/rangy-selectionsaverestore";

interface Props {
    setMoodRead: (mood: number) => void;
    moodWrite: number;
    setText: (text: string) => void;
    text: string;
}

const WriteJournal = ({ setMoodRead, moodWrite, setText, ...props }: Props) => {
    const textarea = useRef<HTMLDivElement>(null);
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (localStorage.getItem("eautosave")) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) setText(decrypt(localStorage.getItem("eautosave")!, pwd));
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
            localStorage.setItem("eautosave", encrypt(props.text, sessionStorage.getItem("pwd")!));
        } else {
            localStorage.setItem("autosave", props.text);
        }
    }, [props.text]);

    const autolink = (e: FormEvent<HTMLDivElement>) => {
        const range = window.getSelection()!.getRangeAt(0);
        const boundaryRange = range.cloneRange();
        boundaryRange.collapse(false);
        const markerText = document.createTextNode("\ufeff");
        boundaryRange.insertNode(markerText);
        
        let html = textarea.current!.innerHTML;
        html = html.replaceAll("<i>", "");
        html = html.replaceAll("</i>", "");
        const linkFinder = /(h\ufeff?t\ufeff?t\ufeff?p\ufeff?(s\ufeff?)?:\ufeff?\/\ufeff?\/\ufeff?)?(w\ufeff?w\ufeff?w\ufeff?\.\ufeff?)?[-a-zA-Z0-9@:%._+~#=\ufeff]{1,256}\.[\ufeffa-z]{2,24}\b([-\ufeffa-zA-Z0-9@:%_+.~;#?&//=]*)/g
        html = html.replaceAll(linkFinder, "<i>$&</i>");
        html = html.replaceAll("\ufeff", "<span id='marker'></span>");
        textarea.current!.innerHTML = html;

        const marker = document.getElementById("marker")!;
        const markerRange = document.createRange();
        markerRange.setStartAfter(marker);
        markerRange.setEndAfter(marker);
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(markerRange);
        marker.remove();
    };

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, text);
        autolink(e);
    };

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">What's happening?</div>
                <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                <label data-value={props.text} className="input-sizer stacked">
                    <div contentEditable={true} ref={textarea} className="tx" onInput={e => autolink(e)} onPaste={e => handlePaste(e)} placeholder="Start typing here!">
                    </div>
                </label>
                { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
                <KeyboardSpacer />
                <br />
            </div>
        </div>
    );
};

export default WriteJournal;
