import { IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { getIdToken } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { toast, networkFailure } from "../../helpers";

const SetPassphrase = ({ finalize } : { finalize: (_: any) => void }) => {
    const [passphrase, setPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [user] = useAuthState(auth);

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

        finalize({
            changing: false,
            passphrase
        });

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

    return <div className="margin-bottom-0 passphrase-box">
        <p>Set up your passphrase below. We recommend using <a href="https://www.useapassphrase.com/" target="_blank" rel="noreferrer">a set of memorable words</a> you haven't used elsewhere, or a password manager.</p>
        <form>
            <IonItem>
                <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                <input autoComplete="new-password" className="invisible-input" value={passphrase} type="password" onChange={e => setPassphrase(e.target.value)} />
            </IonItem>
            <IonItem>
                <IonLabel className="ion-text-wrap" position="stacked">Confirm Passphrase</IonLabel>
                <input autoComplete="new-password" className="invisible-input" value={confirmPassphrase} type="password" onChange={e => setConfirmPassphrase(e.target.value)} />
            </IonItem>
            <br />
            <div className="finish-button" onClick={submitPassphrase}>
                { !submitting && <>Set Passphrase</> }
                { submitting && <IonSpinner className="loader" name="crescent" /> }
            </div>
            <br />
        </form>
    </div>
}

export default SetPassphrase;