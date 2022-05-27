import { IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { SyntheticEvent, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { toast, checkPassphrase, makeRequest } from "../../helpers";

const ChangePassphrase = ({ finalize } : { finalize: (_: string) => void }) => {
    const [oldPassphrase, setOldPassphrase] = useState("");
    const [newPassphrase, setNewPassphrase] = useState("");
    const [newConfirmPassphrase, setNewConfirmPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [user] = useAuthState(auth);

    const submitPassphrase = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        if (!newPassphrase.trim() || newPassphrase.trim().length < 6) {
            toast("Passphrase must be at least 6 characters long!");
            setSubmitting(false);
            return;
        }

        if (newPassphrase !== newConfirmPassphrase) {
            toast("Your passphrases must match!");
            setSubmitting(false);
            return;
        }

        if (!checkPassphrase(oldPassphrase)) {
            toast("Your old passphrase is incorrect, please try again.");
            setSubmitting(false);
            return;
        }

        finalize(newPassphrase);
        makeRequest("changePDPpassphrase", user, { oldPassphrase, newPassphrase }, setSubmitting);
    };

    return <>
        <br />
        <div className="margin-bottom-0 passphrase-box">
            <p>Change your passphrase below. For your new passphrase, we recommend using <a href="https://www.useapassphrase.com/" target="_blank" rel="noreferrer">a set of memorable words</a> you haven't used elsewhere, or a password manager. If you've forgotten your old passphrase, email us { user && <>from { user.email }</> } at <a href="mailto:security@getbaseline.app">security@getbaseline.app</a>.</p>
            <form onSubmit={submitPassphrase}>
                <IonItem>
                    <IonLabel className="ion-text-wrap" position="stacked">Old Passphrase</IonLabel>
                    <input autoComplete="current-password" className="invisible-input" value={oldPassphrase} type="password" onChange={e => setOldPassphrase(e.target.value)} />
                </IonItem>
                <IonItem>
                    <IonLabel className="ion-text-wrap" position="stacked">New Passphrase</IonLabel>
                    <input autoComplete="new-password" className="invisible-input" value={newPassphrase} type="password" onChange={e => setNewPassphrase(e.target.value)} />
                </IonItem>
                <IonItem>
                    <IonLabel className="ion-text-wrap" position="stacked">Confirm New Passphrase</IonLabel>
                    <input autoComplete="new-password" className="invisible-input" value={newConfirmPassphrase} type="password" onChange={e => setNewConfirmPassphrase(e.target.value)} />
                </IonItem>
                <br />
                <div className="finish-button" onClick={submitPassphrase}>
                    { !submitting && <>Change Passphrase</> }
                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                </div>
                <br />
            </form>
        </div>
    </>
}

export default ChangePassphrase;