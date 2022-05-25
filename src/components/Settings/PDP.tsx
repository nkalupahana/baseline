import { IonRadio, IonRadioGroup } from "@ionic/react";
import { DataSnapshot, off, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { changeDatabaseEncryption, parseSettings, setSettings } from "../../helpers";
import Preloader from "../../pages/Preloader";
import SetPassphrase from "./SetPassphrase";
import "./PDP.css";

const PDP = () => {
    const [user] = useAuthState(auth);
    const [method, setMethod] = useState<string | boolean | undefined>(undefined);
    const [showSP, setShowSP] = useState(false);
    const [finalizedPassphrase, setFinalizedPassphrase] = useState({
        changing: false,
        passphrase: "",
    });

    useEffect(() => {
        if (!user) return;  
        const listener = async (snap: DataSnapshot) => {
            const val = await snap.val();
            const pdpSetting = parseSettings()["pdp"];
            const oldMethod = pdpSetting ? pdpSetting : false;
            const newMethod = val ? val : false;

            setSettings("pdp", val);
            setMethod(newMethod);
            if (oldMethod !== newMethod) {
                    setFinalizedPassphrase({
                    ...finalizedPassphrase,
                    changing: true,
                });
            }
        };
        
        const pdpRef = ref(db, `/${user.uid}/pdp/method`);
        onValue(pdpRef, listener);

        return () => {
            off(pdpRef, "value", listener);
        };
    }, [finalizedPassphrase, user]);

    useEffect(() => {
        if (finalizedPassphrase.changing) {
            const oldPwd = sessionStorage.getItem("pwd") ?? "";
            const newPwd = finalizedPassphrase.passphrase;
            console.log("CHANGE");
            console.log(oldPwd);
            console.log(newPwd);
            
            changeDatabaseEncryption(oldPwd, newPwd).then(() => {
                setFinalizedPassphrase({
                    changing: false,
                    passphrase: ""
                });
                setShowSP(false);
            });
        }
    }, [finalizedPassphrase]);

    const changeMethod = (method: string) => {
        set(ref(db, `/${user.uid}/pdp/method`), method);
    }

    return <>
        { method !== undefined && <div>
            <p className="bold margin-bottom-0" style={{"gridArea": "title"}}>Protect Your Data</p>
            <p>If there's a chance someone might get ahold of your device and read your mood logs,
                you can protect your data by adding a passphrase. This passphrase
                can be required up-front whenever the app is opened, or it can be hidden away 
                to make it appear as if you don't use baseline at all.
            </p>
            { !method && !showSP && !finalizedPassphrase.changing && <p className="fake-link" onClick={() => setShowSP(true)}>Set a passphrase to begin.</p> }
            { !method && showSP &&  <SetPassphrase finalize={setFinalizedPassphrase} /> }
            { (typeof method === "string") && <>
                <p className="margin-bottom-0">Local data protection is <span className="bold">enabled.</span></p>
                <br />
                <IonRadioGroup value={method} onIonChange={e => changeMethod(e.detail.value)}>
                    <IonRadio id="upfront" value="upfront" mode="md" />
                    <label className="label-pos" htmlFor="upfront">Up-Front</label>
                    <p className="margin-bottom-0">We'll ask for your passphrase every time the app is opened.</p>
                    <br />
                    <IonRadio id="discreet" value="discreet" mode="md" />
                    <label className="label-pos" htmlFor="discreet">Discreet</label>
                    <p className="margin-bottom-0">When the app is opened, it'll look like you have no mood logs. 
                        In order to view them, you'll have to click on the menu and open settings. When you do this, 
                        we'll ask for your passphrase, which will reveal your mood logs.
                    </p>
                    <br />
                </IonRadioGroup>
                { !finalizedPassphrase.changing && <p className="margin-bottom-0 fake-link">Change Passphrase</p> }
                { !finalizedPassphrase.changing && <p className="margin-bottom-0 fake-link">Remove Passphrase</p> }
            </> }
        </div> }
        { method === undefined && <Preloader /> }
    </>
};

export default PDP;