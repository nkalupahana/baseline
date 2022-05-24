import { IonToggle } from "@ionic/react";
import { useEffect, useState } from "react";
import { parseSettings, setSettings } from "../../helpers";
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
        setSettings(attr, checked);
    }, [checked, attr]);

    return <div className="settings-box-grid">
        <p className="bold margin-bottom-0" style={{"gridArea": "title"}}>{ title }</p>
        <IonToggle style={{"gridArea": "toggle"}} checked={checked} onIonChange={e => setChecked(e.detail.checked)} />
        <p>{ description }</p>
    </div>
};

export default SettingsBox;