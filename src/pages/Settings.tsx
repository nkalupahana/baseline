import { IonIcon, IonSpinner } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import EndSpacer from "../components/EndSpacer";
import KeyboardSpacer from "../components/KeyboardSpacer";
import PDP from "../components/Settings/PDP";
import SettingsBox from "../components/Settings/SettingsBox";
import { goBackSafely } from "../helpers";
import history from "../history";

const Settings = () => {
    const [doingAsyncTask, setDoingAsyncTask] = useState(false);
    useEffect(() => {
        if (localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd")) history.replace("/unlock");
    }, []);

    return <div className="container">
        { !doingAsyncTask && <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon> }
        { doingAsyncTask && <IonSpinner class="top-corner x" className="loader" name="crescent" /> }
        <div className="center-journal container">
            <div className="title">Settings</div>
            <br />
            <div style={{"maxWidth": "600px"}}>
                <SettingsBox 
                    title="Reduce Motion"
                    attr="reduceMotion"
                    description="Turn this on to disable animations. This typically won't increase performance by any noticable amount."
                />
                <PDP taskBlock={setDoingAsyncTask} />
                <br />
                <p className="margin-bottom-0" style={{"alignSelf": "flex-start"}}>Need help? Email us at <a href="mailto:hello@getbaseline.app">hello@getbaseline.app</a>.</p>
                <p>baseline is an open source, volunteer-driven project. If there's a feature you'd like to see or 
                    feedback you have for us, <a href="mailto:feedback@getbaseline.app">email us!</a> And if you'd like
                    to contribute code to baseline, <a href="https://github.com/nkalupahana/baseline" target="_blank" rel="noreferrer">check us out on GitHub</a> — we 
                    appreciate any help we can get. Finally, if you have financial resources to spare, please donate! 100% of 
                    your donation goes right back to users through the gap fund, or to help get baseline to more people.
                </p>
            </div>
        </div>
        <KeyboardSpacer />
        <EndSpacer />
    </div>;
};

export default Settings;