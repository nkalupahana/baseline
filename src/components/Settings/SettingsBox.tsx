import { IonSpinner, IonToggle } from "@ionic/react";
import { get, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { parseSettings, setSettings } from "../../helpers";
import "./SettingsBox.css";

interface Props {
    title: string;
    description: string;
    attr: string;
    syncWithFirebase?: string;
}

const SettingsBox = ({ title, description, attr, syncWithFirebase }: Props) => {
    const [checked, setChecked] = useState<boolean | undefined>(undefined);
    
    useEffect(() => {
        if (checked === undefined) return;
        setSettings(attr, checked);
        if (syncWithFirebase) {
            set(ref(db, syncWithFirebase), checked);
        }
    }, [checked, attr, syncWithFirebase]);

    useEffect(() => {
        if (syncWithFirebase) {
            (async () => {
                const v = await get(ref(db, syncWithFirebase));
                setChecked(v.val() ?? false);
            })();
        } else {
            const settings = parseSettings();
            setChecked(settings[attr] ?? false);
        }
    }, [attr, syncWithFirebase]);

    return <>
        { checked !== undefined && <div className="settings-box-grid">
            <p className="bold margin-bottom-0 margin-top-8" style={{"gridArea": "title"}}>{ title }</p>
            <IonToggle style={{"gridArea": "toggle"}} checked={checked} onIonChange={e => setChecked(e.detail.checked)} />
            <p style={{"gridAutoColumns": "description"}}>{ description }</p>
        </div> }
        { checked === undefined && <div className="text-center" style={{"width": "100%"}}>
            <IonSpinner className="loader" name="crescent" />
        </div> }
    </>
};

export default SettingsBox;