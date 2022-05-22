import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import PDP from "../components/Settings/PDP";
import SettingsBox from "../components/Settings/SettingsBox";
import { goBackSafely } from "../helpers";

const Settings = () => {
    return <div className="container">
        <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
        <div className="center-journal container">
            <div className="title">Settings</div>
            <br />
            <div style={{"maxWidth": "600px"}}>
                <SettingsBox 
                    title="Reduce Motion"
                    attr="reduceMotion"
                    description="Turn this on to disable animations. This typically won't increase performance by any noticable amount."
                />
                <PDP />
            </div>
        </div>
    </div>;
};

export default Settings;