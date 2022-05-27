import { IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { SyntheticEvent, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { toast, checkPassphrase, makeRequest } from "../../helpers";

const RemovePassphrase = ({ finalize } : { finalize: (_: string) => void }) => {
    const [passphrase, setPassphrase] = useState("");
    const [submitting, setSubmitting] = useState(false);
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

        if (!checkPassphrase(passphrase)) {
            toast("Your passphrase is incorrect, please try again.");
            setSubmitting(false);
            return;
        }

        finalize("");
        makeRequest("removePDP", user, { passphrase }, setSubmitting);
    };

    return <>
        <br />
        <div className="margin-bottom-0 passphrase-box">
            <p>In order to remove your passphrase, you need to enter your current one. If you've forgotten it, email us { user && <>from { user.email }</> } at <a href="mailto:security@getbaseline.app">security@getbaseline.app</a>.</p>
            <form onSubmit={submitPassphrase}>
                <IonItem>
                    <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                    <input autoComplete="current-password" className="invisible-input" value={passphrase} type="password" onChange={e => setPassphrase(e.target.value)} />
                </IonItem>
                <br />
                <div className="finish-button" onClick={submitPassphrase}>
                    { !submitting && <>Remove Passphrase</> }
                    { submitting && <IonSpinner className="loader" name="crescent" /> }
                </div>
                <br />
            </form>
        </div>
    </>
}

export default RemovePassphrase;