import "./JournalComponents.css";
import { MutableRefObject, useCallback, useEffect } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { encrypt } from "../../helpers";
import WriteJournal from "./WriteJournal";
import RecordJournal from "./RecordJournal";

interface Props {
    setMoodRead: (mood: number) => void;
    moodWrite: number;
    setText: (text: string) => void;
    editTimestamp: number | null;
    text: string;
    audioChunks: MutableRefObject<Blob[]>;
    elapsedTime: number;
    setElapsedTime: (time: number) => void;
    audioView: boolean;
    setAudioView: (view: boolean) => void;
    addFlag: string | null;
}

const StartJournal = ({ setMoodRead, moodWrite, text, setText, editTimestamp, audioChunks, elapsedTime, setElapsedTime, audioView, setAudioView, addFlag } : Props) => {
    const next = useCallback(() => {
        history.push("/journal/finish");
    }, []);

    useEffect(() => {
        setMoodRead(moodWrite);
    }, [setMoodRead, moodWrite]);

    useEffect(() => {
        if (!text || editTimestamp || addFlag) return;

        const pwd = sessionStorage.getItem("pwd");
        if (pwd) {
            localStorage.setItem("eautosave", encrypt(text, pwd));
        } else {
            localStorage.setItem("autosave", text);
        }
    }, [text, editTimestamp, addFlag]);

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                { !editTimestamp && <>
                    <div className="title">What's happening?</div>
                    <p className="text-center bold max-width-600 margin-top-8">{ !!addFlag ? "Yesterday: what" : "What" } have you been doing, how have you been feeling, and why might you be feeling that way?</p>
                </> }
                { !!editTimestamp && 
                    <>
                        <div className="title">Edit Journal</div> 
                        <div className="br"></div>
                    </>
                }
                { !audioView && <WriteJournal 
                    text={text} 
                    setText={setText} 
                    next={next} 
                    setAudioView={setAudioView} 
                    editTimestamp={editTimestamp}
                /> }
                { audioView && <RecordJournal 
                    audioChunks={audioChunks} 
                    elapsedTime={elapsedTime}
                    setElapsedTime={setElapsedTime}
                    next={next}
                    setAudioView={setAudioView}
                /> }
            </div>
        </div>
    );
};

export default StartJournal;
