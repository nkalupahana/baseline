import { IonItem, IonLabel, IonSpinner } from "@ionic/react";
import { getIdToken } from "firebase/auth";
import { SyntheticEvent, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { toast, networkFailure, checkPassphrase } from "../../helpers";

const RemovePassphrase = ({ finalize } : { finalize: (_: any) => void }) => {
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

        finalize({
            changing: false,
            passphrase: ""
        });

        let response;
        try {
            response = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/removePDP",{
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