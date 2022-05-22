import { IonToggle } from "@ionic/react";
import { useEffect, useState } from "react";
import { parseSettings } from "../../helpers";
import "./SettingsBox.css";

interface Props {
    title: string;
    description: string;
    attr: string;
}

const SettingsBox = ({ title, description, attr }: Props) => {
    const settings = parseSettings();
    const [checked, setChecked] = useState(settings[attr]);
    
    useEffect(() => {
        let data = parseSettings();
        data[attr] = checked;
        localStorage.setItem("settings", JSON.stringify(data));
    }, [checked, attr]);

    return <div className="settings-box-grid">
        <p className="bold margin-bottom-0" style={{"gridArea": "title"}}>{ title }</p>
        <IonToggle style={{"gridArea": "toggle"}} checked={checked} onIonChange={e => setChecked(e.detail.checked)} />
        <p>{ description }</p>
    </div>
};

export default SettingsBox;