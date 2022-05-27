import { IonIcon, IonSpinner } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import EndSpacer from "../components/EndSpacer";
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
            </div>
        </div>
        <EndSpacer />
    </div>;
};

export default Settings;