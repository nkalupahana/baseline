import { IonRadio, IonRadioGroup } from "@ionic/react";
import { DataSnapshot, off, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { changeDatabaseEncryption, parseSettings, setSettings } from "../../helpers";
import Preloader from "../../pages/Preloader";
import SetPassphrase from "./SetPassphrase";
import "./PDP.css";
import RemovePassphrase from "./RemovePassphrase";
import ChangePassphrase from "./ChangePassphrase";

const PDP = () => {
    const [user] = useAuthState(auth);
    const [method, setMethod] = useState<string | boolean | undefined>(undefined);
    const [showSP, setShowSP] = useState(false);
    const [showCP, setShowCP] = useState(false);
    const [showRP, setShowRP] = useState(false);
    const [finalizedPassphrase, setFinalizedPassphrase] = useState("");

    // Passphrase update received, change encryption as needed
    useEffect(() => {
        if (!user) return;  
        const listener = async (snap: DataSnapshot) => {
            const updateOld = parseSettings()["passphraseUpdate"];
            const update = await snap.val();
            if (update !== updateOld && !(!update && !updateOld)) {
                setSettings("passphraseUpdate", update);
                const oldPwd = sessionStorage.getItem("pwd") ?? "";
                const newPwd = finalizedPassphrase;

                changeDatabaseEncryption(oldPwd, newPwd).then(() => {
                    setFinalizedPassphrase("");
                    setShowSP(false);
                    setShowRP(false);
                    setShowCP(false);
                });
            }
        };
        
        const pdpRef = ref(db, `/${user.uid}/pdp/passphraseUpdate`);
        onValue(pdpRef, listener);

        return () => {
            off(pdpRef, "value", listener);
        };
    }, [finalizedPassphrase, user]);

    // Passphrase method updated, update state/settings
    useEffect(() => {
        if (!user) return;  
        const listener = async (snap: DataSnapshot) => {
            const val = await snap.val();
            setSettings("pdp", val);
            setMethod(val);
        };
        
        const pdpRef = ref(db, `/${user.uid}/pdp/method`);
        onValue(pdpRef, listener);

        return () => {
            off(pdpRef, "value", listener);
        };
    }, [finalizedPassphrase, user]);

    // Send update to database
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
            { !method && !finalizedPassphrase && <p className="fake-link" onClick={() => setShowSP(!showSP)}>Set a passphrase to begin.</p> }
            { !method && showSP && <SetPassphrase finalize={setFinalizedPassphrase} /> }
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
                { !finalizedPassphrase && <p className="margin-bottom-0 fake-link" onClick={() => setShowCP(!showCP)}>Change Passphrase</p> }
                { method && showCP && <ChangePassphrase finalize={setFinalizedPassphrase} /> }
                { !finalizedPassphrase && <p className="margin-bottom-0 fake-link" onClick={() => setShowRP(!showRP)}>Remove Passphrase</p> }
                { method && showRP && <RemovePassphrase finalize={setFinalizedPassphrase} /> }
            </> }
        </div> }
        { method === undefined && <Preloader /> }
    </>
};

export default PDP;