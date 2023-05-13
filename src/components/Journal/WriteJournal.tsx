import "./JournalComponents.css";
import { FormEvent, useEffect, useRef } from "react";
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
        if ((e.nativeEvent as InputEvent).inputType === "insertText") {
            const sel = (rangy as any).saveSelection();
            let html = textarea.current!.innerHTML;
            html = html.replaceAll("<i>", "");
            html = html.replaceAll("</i>", "");
            const linkFinder = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-;a-zA-Z0-9@:%_+.~#?&//=]*)/g
            html = html.replaceAll(linkFinder, "<i>$&</i>");
            textarea.current!.innerHTML = html;
            (rangy as any).restoreSelection(sel);
            (rangy as any).removeMarkers(sel);
        }
    }

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">What's happening?</div>
                <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                <label data-value={props.text} className="input-sizer stacked">
                    <div contentEditable={true} ref={textarea} className="tx" onInput={e => autolink(e)} placeholder="Start typing here!">
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
