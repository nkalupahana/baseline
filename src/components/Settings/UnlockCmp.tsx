import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { IonItem, IonLabel } from "@ionic/react";
import { SyntheticEvent } from "react";

const UnlockCmp = ({ unlock, getter, setter } : { unlock: (e: SyntheticEvent) => void, getter: string, setter: (_: string) => void; }) => {
    const [user] = useAuthState(auth);

    return <>
        <div className="title">Unlock baseline</div>
            <div className="br"></div>
            <div style={{"width": "100%", "maxWidth": "600px"}}>
                <form onSubmit={unlock}>
                    <IonItem>
                        <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                        <input autoComplete="current-password" className="invisible-input" value={getter} type="password" onChange={e => setter(e.target.value)} />
                    </IonItem>
                </form>
                <div className="br"></div><div className="br"></div>
                <div className="finish-button" onClick={unlock}>
                    Submit
                </div>
                <div className="br"></div>
                <p className="margin-bottom-0">Forgot your passphrase? Email us { user?.email && <>from { user.email }</> } at <a href="mailto:security@getbaseline.app">security@getbaseline.app</a>.</p>
                { user && <p style={{"fontSize": "12px"}}>UID: { user.uid }</p> }
        </div>
    </>;
}

export default UnlockCmp;