import { IonSpinner, IonToggle } from "@ionic/react";
import { User } from "firebase/auth";
import { ref, get, set, serverTimestamp, remove } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { setSettings } from "../../helpers";
import SettingsBox from "./SettingsBox";

const BeginnerModeSettings = ({ user } : { user: User }) => {
    const [beginnerMode, setBeginnerMode] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        if (!user) return;
        (async () => {
            const snap = await get(ref(db, `/${user.uid}/onboarding/beginner`));
            setBeginnerMode(!!snap.val() ?? false);
            setSettings("beginner", snap.val() ?? 0);
        })();
    }, [user]);

    const updateBeginnerMode = async (checked: boolean) => {
        const beginnerRef = ref(db, `/${user.uid}/onboarding/beginner`);
        if (checked) {
            await set(ref(db, `/${user.uid}/onboarding/beginner`), serverTimestamp());
            setSettings("beginner", Date.now());
        } else {
            await remove(beginnerRef);
            setSettings("beginner", 0);
            setSettings("introQuestions", false);
        }
    }
    
    return <>
        { beginnerMode !== undefined && <div className="settings-box-grid">
            <p className="bold margin-bottom-0 margin-top-8" style={{"gridArea": "title"}}>Standard Mode</p>
            <IonToggle style={{"gridArea": "toggle"}} checked={beginnerMode} onIonChange={e => {
                updateBeginnerMode(e.detail.checked);
                setBeginnerMode(e.detail.checked);
            }} />
            <p style={{"gridAutoColumns": "description"}}>Turn this on to get additional journaling support features for a few weeks.</p>
        </div> }
        { beginnerMode === undefined && <div className="text-center" style={{"width": "100%"}}>
            <IonSpinner className="loader" name="crescent" />
        </div> }
        { beginnerMode && <SettingsBox
            attr="introQuestions"
            title="Practice Prompts"
            description="Not comfortable writing about yourself? Enable practice prompts for a few weeks. (Coming soon)"
            syncWithFirebase={`${user.uid}/onboarding/questions`}
        ></SettingsBox> }
    </>
}

export default BeginnerModeSettings;