import { IonToggle } from "@ionic/react";
import "./SettingsBox.css";

interface Props {
    title: string;
    description: string;
    checked: boolean;
    setChecked: (_: boolean) => void;
}

const SettingsBox = ({ title, description, checked, setChecked }: Props) => {
    return <div className="settings-box-grid">
        <p className="bold margin-bottom-0" style={{"gridArea": "title"}}>{ title }</p>
        <IonToggle style={{"gridArea": "toggle"}} checked={checked} onIonChange={e => setChecked(e.detail.checked)} />
        <p>{ description }</p>
    </div>
};

export default SettingsBox