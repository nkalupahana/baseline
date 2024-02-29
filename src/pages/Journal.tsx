import { Route } from "react-router-dom";
import WriteJournal from "../components/Journal/WriteJournal";
import FinishJournal from "../components/Journal/FinishJournal";
import { useEffect, useState } from "react";
import "./Container.css";
import { checkKeys, decrypt } from "../helpers";
import { signOutAndCleanUp } from "../firebase";

const Journal = () => {
    const [text, setText] = useState("");
    const [files, setFiles] = useState([]);
    const [moodRead, setMoodRead] = useState(0);
    const [moodWrite, setMoodWrite] = useState(0);
    const [average, setAverage] = useState("average");
    
    useEffect(() => {
        const keys = checkKeys();
        if (!keys) {
            signOutAndCleanUp();
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
    }, []);

    return (
        <>
            <Route exact path="/journal">
                <WriteJournal text={text} setText={setText} setMoodRead={setMoodRead} moodWrite={moodWrite} />
            </Route>
            <Route path="/journal/finish">
                <FinishJournal files={files} setFiles={setFiles} text={text} moodWrite={moodWrite} setMoodWrite={setMoodWrite} moodRead={moodRead} average={average} setAverage={setAverage} />
            </Route>
        </>
    );
};

export default Journal;
