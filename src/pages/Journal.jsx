import { IonPage, IonIcon } from "@ionic/react";
import { Switch } from "react-router";
import { Route } from "react-router-dom";
import WriteJournal from "../components/WriteJournal";
import FinishJournal from "../components/FinishJournal";
import { useState } from "react";
import { closeOutline } from "ionicons/icons";
import history from "../history";
import "./Container.css";

const Journal = () => {
    const [text, setText] = useState("");
    const [moodRead, setMoodRead] = useState(0);
    const [moodWrite, setMoodWrite] = useState(0);
    const [average, setAverage] = useState("average");

    return (
        <IonPage>
            <div className="container">
                <IonIcon class="top-corner" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
                <Switch>
                    <Route exact path="/journal">
                        <WriteJournal text={text} setText={setText} setMoodRead={setMoodRead} moodWrite={moodWrite} />
                    </Route>
                    <Route exact path="/journal/finish">
                        <FinishJournal text={text} moodWrite={moodWrite} setMoodWrite={setMoodWrite} moodRead={moodRead} average={average} setAverage={setAverage} />
                    </Route>
                </Switch>
            </div>
        </IonPage>
    );
};

export default Journal;
