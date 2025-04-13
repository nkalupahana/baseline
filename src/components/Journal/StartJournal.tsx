import "./JournalComponents.css";
import { MutableRefObject, useCallback, useEffect } from "react";
import history from "../../history";
import { closeOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { encrypt } from "../../helpers";
import WriteJournal from "./WriteJournal";
import RecordJournal from "./RecordJournal";
import InfoBadge from "./InfoBadge";

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

    let title = "What's happening?";
    const summaryJournal = addFlag?.startsWith("summary");
    if (summaryJournal) {
        title = "What happened?";
    }

    let subtitle = "What have you been doing, how have you been feeling, and why might you be feeling that way?";

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                { !editTimestamp && <>
                    <div className="title">{ title }</div>
                    { !summaryJournal && <p className="text-center bold max-width-600 margin-top-8">{ subtitle }</p> }
                    { summaryJournal && <InfoBadge>Summary journal for yesterday</InfoBadge>}
                </> }
                { !!editTimestamp && 
                    <>
                        <div className="title">What's happening?</div> 
                        <InfoBadge>Editing saved journal</InfoBadge>
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
