import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import SettingsBox from "../components/Settings/SettingsBox";
import { goBackSafely, parseSettings } from "../helpers";

const Settings = () => {
    const settings = parseSettings();
    const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion);

    useEffect(() => {
        let data = parseSettings();
        data["reduceMotion"] = reduceMotion;
        localStorage.setItem("settings", JSON.stringify(data));
    }, [reduceMotion]);

    return <div className="container">
        <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
        <div className="center-journal container">
            <div className="title">Settings</div>
            <br />
            <div style={{"maxWidth": "600px"}}>
                <SettingsBox 
                    title="Reduce Motion" 
                    description="Turn this on to disable animations. This typically will not increase performance by any noticable amount." 
                    checked={reduceMotion}
                    setChecked={setReduceMotion}
                />
            </div>

        </div>
    </div>;
};

export default Settings;