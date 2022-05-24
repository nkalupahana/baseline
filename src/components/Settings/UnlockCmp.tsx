import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { IonItem, IonLabel } from "@ionic/react";

const UnlockCmp = ({ unlock, getter, setter } : { unlock: () => void, getter: string, setter: (_: string) => void; }) => {
    const [user] = useAuthState(auth);

    return <>
        <div className="title">Unlock baseline</div>
            <br />
            <div style={{"width": "100%", "maxWidth": "600px"}}>
                <form>
                    <IonItem>
                        <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                        <input autoComplete="new-password" className="invisible-input" value={getter} type="password" onChange={e => setter(e.target.value)} />
                    </IonItem>
                </form>
                <br /><br />
                <div className="finish-button" onClick={unlock}>
                    Submit
                </div>
                <br />
                <p className="margin-bottom-0">Forgot your passphrase? Email us from the email you made this account with { user && <>({ user.email })</> } at <a href="mailto:security@getbaseline.app">security@getbaseline.app</a>.</p>
                { user && <p style={{"fontSize": "12px"}}>UID: { user.uid }</p> }
        </div>
    </>;
}

export default UnlockCmp;