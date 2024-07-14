import { Route } from "react-router-dom";
import StartJournal from "../components/Journal/StartJournal";
import FinishJournal from "../components/Journal/FinishJournal";
import { useEffect, useRef, useState } from "react";
import "./Container.css";
import { checkKeys, decrypt } from "../helpers";
import { signOutAndCleanUp } from "../firebase";
import * as Sentry from "@sentry/react";

export interface SpotifySelection {
    uri: string;
    name: string;
}


const getStartingText = () => {
    let text = "";
    if (localStorage.getItem("eautosave")) {
        const pwd = sessionStorage.getItem("pwd");
        if (pwd) text = decrypt(localStorage.getItem("eautosave") ?? "", pwd);
    } else {
        const autosave = localStorage.getItem("autosave");
        if (autosave) {
            text = autosave;
        }
    }

    if (localStorage.getItem("editTimestamp")) {
        localStorage.removeItem("eautosave");
        localStorage.removeItem("autosave");
    }

    return text;
}

const Journal = () => {
    // Standard journaling
    const [text, setText] = useState(getStartingText());
    const [files, setFiles] = useState([]);
    const [moodRead, setMoodRead] = useState(0);
    const [moodWrite, setMoodWrite] = useState(0);
    const [average, setAverage] = useState("average");
    // Editing
    const [editTimestamp, setEditTimestamp] = useState<number | null>(null);
    // Spotify integration
    const [song, setSong] = useState<SpotifySelection | undefined>(undefined);
    // Audio recording
    const audioChunks = useRef<Blob[]>([]);
    const [audioView, setAudioView] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    
    useEffect(() => {
        const keys = checkKeys();
        if (!keys) {
            Sentry.addBreadcrumb({
                category: "Journal.tsx",
                message: "Sign Out"
            });
            signOutAndCleanUp();
        }
        
        // Get edit parameters
        const editTimestamp = localStorage.getItem("editTimestamp");
        const editAverage = localStorage.getItem("editAverage");
        const editMood = localStorage.getItem("editMood");
        if (editTimestamp && editMood && editAverage) {
            setEditTimestamp(Number(editTimestamp));
            setMoodRead(Number(editMood));
            setAverage(editAverage);
            localStorage.removeItem("editMood");
            localStorage.removeItem("editAverage");
            localStorage.removeItem("editTimestamp");
        }
    }, []);

    return (
        <>
            <Route exact path="/journal">
                <StartJournal 
                    text={text} 
                    setText={setText} 
                    setMoodRead={setMoodRead} 
                    moodWrite={moodWrite} 
                    editTimestamp={editTimestamp}
                    audioChunks={audioChunks}
                    elapsedTime={elapsedTime}
                    setElapsedTime={setElapsedTime}
                    audioView={audioView}
                    setAudioView={setAudioView}
                />
            </Route>
            <Route path="/journal/finish">
                <FinishJournal 
                    files={files} 
                    setFiles={setFiles} 
                    text={text} 
                    moodWrite={moodWrite} 
                    setMoodWrite={setMoodWrite} 
                    moodRead={moodRead} 
                    average={average} 
                    setAverage={setAverage} 
                    editTimestamp={editTimestamp}
                    song={song}
                    setSong={setSong}
                    audioChunks={audioChunks}
                    elapsedTime={elapsedTime}
                />
            </Route>
        </>
    );
};

export default Journal;
