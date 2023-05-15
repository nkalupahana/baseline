import "./JournalComponents.css";
import { ClipboardEvent, useEffect, useMemo, useRef } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import KeyboardSpacer from "../KeyboardSpacer";
import { decrypt, encrypt } from "../../helpers";
import { throttle } from "lodash";

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
        if (!textarea.current) return;
        if (localStorage.getItem("eautosave")) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) {
                const text = decrypt(localStorage.getItem("eautosave")!, pwd);
                setText(text);
                textarea.current!.innerHTML = text;
                autolink();
            }
        } else {
            const autosave = localStorage.getItem("autosave");
            if (autosave) {
                setText(autosave);
                textarea.current.innerHTML = autosave;
                autolink();
            }
        }

        textarea.current.focus();
    }, [setText]);

    useEffect(() => {
        if (sessionStorage.getItem("pwd")) {
            localStorage.setItem("eautosave", encrypt(props.text, sessionStorage.getItem("pwd")!));
        } else {
            localStorage.setItem("autosave", props.text);
        }
    }, [props.text]);

    const autolink = () => {
        if (!textarea.current) return;
        const selection = window.getSelection()!;
        let hasSelection = false;
        // On reload, no selection
        if (selection.rangeCount !== 0) {
            const range = window.getSelection()!.getRangeAt(0);
            // On switch from /journal/finish, range is not part of textarea
            if (textarea.current?.contains(range.startContainer)) {
                hasSelection = true;
                const boundaryRange = range.cloneRange();
                boundaryRange.collapse(false);
                const markerText = document.createTextNode("\ufeff");
                boundaryRange.insertNode(markerText);
            }
        }
        
        // Construct links
        let html = textarea.current!.innerHTML;
        html = html.replaceAll("<span>", "");
        html = html.replaceAll("</span>", "");
        const linkFinder = /(h\ufeff?t\ufeff?t\ufeff?p\ufeff?(s\ufeff?)?:\ufeff?\/\ufeff?\/\ufeff?)?(w\ufeff?w\ufeff?w\ufeff?\.\ufeff?)?[-a-zA-Z0-9@:%._+~#=\ufeff]{1,256}\.[\ufeffa-z]{2,24}\b([-\ufeffa-zA-Z0-9@:%_+.~#?&//=]*)(?=&nbsp;)/g
        html = html.replaceAll(linkFinder, "<span>$&</span>");
        html = html.replaceAll("\ufeff", "<i id='marker'></i>");
        // Just put cursor on end if no prior selection
        if (!hasSelection) html += "<i id='marker'></i>";
        textarea.current.innerHTML = html;

        // Recreate marker
        const marker = document.getElementById("marker")!;
        const markerRange = document.createRange();
        markerRange.setStartAfter(marker);
        markerRange.setEndAfter(marker);
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(markerRange);
        marker.remove();
    };

    const throttledAutolink = useMemo(() => throttle(autolink, 250), []);

    const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertHTML", false, text);
        autolink();
    };

    const inputChange = () => {
        setText(textarea.current?.innerText || "");
        throttledAutolink();
    }

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">What's happening?</div>
                <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                <div data-placeholder="Start typing here!" contentEditable={true} ref={textarea} className="tx" onInput={e => inputChange()} onPaste={e => handlePaste(e)}></div>
                { props.text.trim() && <div onClick={next} className="fake-button">Continue</div> }
                <KeyboardSpacer />
                <br />
            </div>
        </div>
    );
};

export default WriteJournal;
