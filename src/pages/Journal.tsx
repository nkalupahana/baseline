import { Route } from "react-router-dom";
import StartJournal from "../components/Journal/StartJournal";
import FinishJournal from "../components/Journal/FinishJournal";
import { useEffect, useState } from "react";
import "./Container.css";
import { checkKeys, decrypt } from "../helpers";
import { signOutAndCleanUp } from "../firebase";

export interface SpotifySelection {
    uri: string;
    name: string;
}


const Journal = () => {
    const [text, setText] = useState("");
    const [files, setFiles] = useState([]);
    const [moodRead, setMoodRead] = useState(0);
    const [moodWrite, setMoodWrite] = useState(0);
    const [average, setAverage] = useState("average");
    const [editTimestamp, setEditTimestamp] = useState<number | null>(null);
    const [song, setSong] = useState<SpotifySelection | undefined>(undefined);
    const [audio, setAudio] = useState<Blob | null>(null);
    
    useEffect(() => {
        const keys = checkKeys();
        if (!keys) {
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

    useEffect(() => {
        if (localStorage.getItem("eautosave")) {
            const pwd = sessionStorage.getItem("pwd");
            if (pwd) setText(decrypt(localStorage.getItem("eautosave") ?? "", pwd));
        } else {
            const autosave = localStorage.getItem("autosave");
            if (autosave) {
                setText(autosave);
            }
        }

        if (editTimestamp) {
            localStorage.removeItem("eautosave");
            localStorage.removeItem("autosave");
        }
    }, [editTimestamp]);

    return (
        <>
            <Route exact path="/journal">
                <StartJournal 
                    text={text} 
                    setText={setText} 
                    setMoodRead={setMoodRead} 
                    moodWrite={moodWrite} 
                    editTimestamp={editTimestamp}
                    setAudio={setAudio}
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
                    audio={audio}
                />
            </Route>
        </>
    );
};

export default Journal;
