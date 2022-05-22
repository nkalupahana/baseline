import { IonItem, IonLabel, IonRadio, IonRadioGroup, IonSpinner } from "@ionic/react";
import { getIdToken } from "firebase/auth";
import { DataSnapshot, off, onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import ldb from "../../db";
import { auth, db } from "../../firebase";
import { networkFailure, parseSettings, toast } from "../../helpers";
import Preloader from "../../pages/Preloader";
import "./PDP.css";

const PDP = () => {
    const [user] = useAuthState(auth);
    const [method, setMethod] = useState<string | boolean | undefined>(undefined);
    const [passphraseBox, setPassphraseBox] = useState(false);
    const [passphrase, setPassphrase] = useState("");
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [updateEncryption, setUpdateEncryption] = useState(0);
    const [finalizedPassphrase, setFinalizedPassphrase] = useState("");

    useEffect(() => {
        if (!user) return;
        const listener = async (snap: DataSnapshot) => {
            const val = await snap.val();
            let settings = parseSettings();
            settings["pdp"] = val;
            localStorage.setItem("settings", JSON.stringify(settings));
            setMethod(val ? val : false);
            setSubmitting(false);
            setUpdateEncryption(Math.random());
        };
        
        const pdpRef = ref(db, `/${user.uid}/pdp/method`);
        onValue(pdpRef, listener);

        return () => {
            off(pdpRef, "value", listener);
        };
    }, [user]);

    useEffect(() => {
        if (updateEncryption !== 0 && finalizedPassphrase !== "") {
            ldb.elogs.clear().then(async () => {
                ldb.elogs.add({
                    key: 0,
                    data: JSON.stringify(await ldb.logs.toArray())
                });
            });
            localStorage.setItem("ekeys", localStorage.getItem("keys") ?? "");
            setFinalizedPassphrase("");
        }
    }, [updateEncryption, finalizedPassphrase]);

    const submitPassphrase = async () => {
        if (submitting) return;
        setSubmitting(true);
        if (!passphrase.trim() || passphrase.trim().length < 6) {
            toast("Passphrase must be at least 6 characters long!");
            setSubmitting(false);
            return;
        }

        if (passphrase !== confirmPassphrase) {
            toast("Your passphrases must match!");
            setSubmitting(false);
            return;
        }

        setFinalizedPassphrase(passphrase);

        let response;
        try {
            response = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/enablePDP",{
                method: "POST",
                headers: {
                    Authorization: `Bearer ${await getIdToken(user)}`,
                },
                body: JSON.stringify({
                    passphrase
                })
            });
        } catch (e: any) {
            if (networkFailure(e.message)) {
                toast(`We can't reach our servers. Check your internet connection and try again.`);
            } else {
                toast(`Something went wrong, please try again! \nError: ${e.message}`);
            }
            setSubmitting(false);
            return;
        }

        if (response) {
            if (!response.ok) {
                toast(`Something went wrong, please try again! \nError: ${await response.text()}`);
                setSubmitting(false);
            }
        } else {
            toast(`Something went wrong, please try again!`);
            setSubmitting(false);
        }
    };

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
            { !method && !passphraseBox && <p className="fake-link" onClick={() => setPassphraseBox(true)}>Set a passphrase to begin.</p> }
            { !method && passphraseBox && <div className="margin-bottom-0 passphrase-box">
                <p>Set up your passphrase below. We recommend using <a href="https://www.useapassphrase.com/" target="_blank" rel="noreferrer">a set of memorable words</a> you haven't used elsewhere, or a password manager.</p>
                <form>
                    <IonItem>
                        <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                        <input className="invisible-input" value={passphrase} type="password" onChange={e => setPassphrase(e.target.value)} />
                    </IonItem>
                    <IonItem>
                        <IonLabel className="ion-text-wrap" position="stacked">Confirm Passphrase</IonLabel>
                        <input className="invisible-input" value={confirmPassphrase} type="password" onChange={e => setConfirmPassphrase(e.target.value)} />
                    </IonItem>
                    <br />
                    <div className="finish-button" onClick={submitPassphrase}>
                        { !submitting && <>Set Passphrase</> }
                        { submitting && <IonSpinner className="loader" name="crescent" /> }
                    </div>
                    <br />
                </form>
            </div> }
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
                <p className="margin-bottom-0 fake-link">Change Passphrase</p>
                <p className="margin-bottom-0 fake-link">Remove Passphrase</p>
            </> }
        </div> }
        { method === undefined && <Preloader /> }
    </>
};

export default PDP;