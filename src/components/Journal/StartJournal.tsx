import "./JournalComponents.css";
import { useEffect, useRef } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { encrypt } from "../../helpers";
import WriteJournal from "./WriteJournal";

interface Props {
    setMoodRead: (mood: number) => void;
    moodWrite: number;
    setText: (text: string) => void;
    editTimestamp: number | null;
    text: string;
}

const StartJournal = ({ setMoodRead, moodWrite, text, setText, editTimestamp } : Props) => {
    const textarea = useRef<HTMLTextAreaElement>(null);
    const next = () => {
        history.push("/journal/finish");
    };

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (!textarea.current) return;
        textarea.current.focus();
    }, []);

    useEffect(() => {
        if (!text || editTimestamp) return;

        const pwd = sessionStorage.getItem("pwd");
        if (pwd) {
            localStorage.setItem("eautosave", encrypt(text, pwd));
        } else {
            localStorage.setItem("autosave", text);
        }
    }, [text, editTimestamp]);

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                { !editTimestamp && <>
                    <div className="title">What's happening?</div>
                    <p className="text-center bold max-width-600 margin-top-8">What have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                </> }
                { !!editTimestamp && 
                    <>
                        <div className="title">Edit Journal</div> 
                        <div className="br"></div>
                    </>
                }
                <WriteJournal textarea={textarea} text={text} setText={setText} next={next} />
            </div>
        </div>
    );
};

export default StartJournal;
