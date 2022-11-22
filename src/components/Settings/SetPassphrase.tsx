import { IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { SyntheticEvent, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { toast, makeRequest } from "../../helpers";

const SetPassphrase = ({ finalize } : { finalize: (_: string) => void }) => {
    const [passphrase, setPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [confirmPassphrase, setConfirmPassphrase] = useState("");
    const [user] = useAuthState(auth);

    const submitPassphrase = async (e: SyntheticEvent) => {
        e.preventDefault();
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

        finalize(passphrase);
        makeRequest("pdp/enable", user, { passphrase }, setSubmitting);
    };

    return <div className="margin-bottom-0 passphrase-box">
        <p>Set up your passphrase below. We recommend using <a href="https://www.useapassphrase.com/" target="_blank" rel="noreferrer">a set of memorable words</a> you haven't used elsewhere, or a password manager.</p>
        <form onSubmit={submitPassphrase}>
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