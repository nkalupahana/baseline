import { IonContent, IonPage } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Switch } from "react-router";
import { Route } from "react-router-dom";
import WriteJournal from "../components/WriteJournal";
import FinishJournal from "../components/FinishJournal";
import { useState } from "react";
import "./Journal.css";

const Journal = () => {
    const [text, setText] = useState("");
    const [moodRead, setMoodRead] = useState(0);
    const [moodWrite, setMoodWrite] = useState(0);
    const [average, setAverage] = useState("average");

    return (
        <IonPage>
            <IonReactRouter>
                <div className="container">
                    <Switch>
                        <Route exact path="/journal">
                            <WriteJournal text={text} setText={setText} setMoodRead={setMoodRead} moodWrite={moodWrite} />
                        </Route>
                        <Route exact path="/journal/finish">
                            <FinishJournal text={text} setMoodWrite={setMoodWrite} moodRead={moodRead} average={average} setAverage={setAverage} />
                        </Route>
                    </Switch>
                </div>
            </IonReactRouter>
        </IonPage>
    );
};

export default Journal;
