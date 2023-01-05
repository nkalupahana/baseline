import { IonAlert, IonIcon, IonSpinner } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import KeyboardSpacer from "../components/KeyboardSpacer";
import BeginnerModeSettings from "../components/Settings/BeginnerModeSettings";
import PDP from "../components/Settings/PDP";
import SettingsBox from "../components/Settings/SettingsBox";
import { auth, signOutAndCleanUp } from "../firebase";
import { checkKeys, goBackSafely, toast } from "../helpers";
import history from "../history";

const Settings = () => {
    const [doingAsyncTask, setDoingAsyncTask] = useState(false);
    const [showKeys, setShowKeys] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [user] = useAuthState(auth);
    const keys = checkKeys();
    useEffect(() => {
        if (localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd")) history.replace("/unlock");
    }, []);

    return <div className="container">
        { !doingAsyncTask && <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon> }
        { doingAsyncTask && <IonSpinner class="top-corner x" className="loader" name="crescent" /> }
        <div className="center-journal container">
            <div className="title">Settings</div>
            <br />
            <div style={{"maxWidth": "600px"}}>
                <BeginnerModeSettings user={user} />
                <div className="horizontal-line"></div>
                <SettingsBox 
                    title="Reduce Motion"
                    attr="reduceMotion"
                    description="Turn this on to disable some animations. This typically won't increase performance by any noticable amount."
                />
                <SettingsBox 
                    title="Use Colorblind-Friendly Colors"
                    attr="colorblind"
                    description="Turn this on to use colorblind-friendly colors on the summary page graphs."
                />
                <SettingsBox 
                    title="Skip Week In Review"
                    attr="skipWIR"
                    description="Turn this on to get the option to skip Week In Review each week. (We don't recommend turning this on — Week In Review is quite useful, and only takes a few minutes each week.)"
                />
                <PDP taskBlock={setDoingAsyncTask} />
                <br />
                <p className="margin-bottom-0" style={{"alignSelf": "flex-start"}}>Need help? Email us at <a href="mailto:hello@getbaseline.app">hello@getbaseline.app</a>.</p>
                <p>
                    baseline is an open source, volunteer-driven project. If there's a feature you'd like to see or 
                    feedback you have for us, <a href="mailto:feedback@getbaseline.app">email us!</a> And if you'd like
                    to contribute code to baseline, <a href="https://github.com/nkalupahana/baseline" target="_blank" rel="noreferrer">check us out on GitHub</a> — we 
                    appreciate any help we can get. Finally, if you have financial resources to 
                    spare, <span className="fake-link" onClick={() => history.push("/donate")}>please donate!</span> 100% of 
                    your donation goes right back to users through the gap fund, or to help get baseline to more people.
                </p>
                <p>
                    Want a copy of the data you've submitted to us? We're working on automating
                    this, but for now, email us at <a href="mailto:privacy@getbaseline.app">privacy@getbaseline.app.</a>
                </p>
                <p>
                    If you'd like to delete your account, <span className="fake-link" onClick={() => setDeleteAlert(true)}>click here.</span> You'll be prompted to sign in again to confirm.
                </p>
                <p className="bold">Technical Details</p>
                { user && <p className="small-text margin-bottom-0 margin-top-8">UID: { user.uid }</p> }
                { typeof keys === "object" && <p className="fake-link small-text" onClick={() => setShowKeys(!showKeys)}>{ showKeys ? "Hide" : "Show"} Encryption Keys</p>}
                { showKeys && <>
                    <p className="small-text margin-bottom-0 margin-top-8">These are the keys to all of your private information.
                    Not even we have them. Never give these to anyone, no matter how nicely they ask. Ever.</p>
                    <p className="small-text margin-bottom-0 margin-top-8">Visible Key: { keys.visibleKey }</p> 
                    <p style={{"overflowWrap": "anywhere"}} className="small-text margin-top-8">Encrypted Key (Visible): { keys.encryptedKeyVisible }</p>
                </> }
            </div>
        </div>
        <IonAlert 
            isOpen={deleteAlert}
            onDidDismiss={() => setDeleteAlert(false)}
            header="Are you sure?"
            message="Deleting your account will result in all of your data being irreversibly lost. This cannot be undone. You will need to sign in again to complete the deletion process."
            buttons={[
                {
                    text: 'Cancel',
                    role: 'cancel'
                },
                {
                    text: 'Delete',
                    role: 'confirm',
                    handler: () => { 
                        sessionStorage.setItem("deleteAccount", user.uid);
                        signOutAndCleanUp();
                        toast("Sign in again now to delete your account.");
                    }
                }
            ]}         
        />
        <KeyboardSpacer />
        <EndSpacer />
    </div>;
};

export default Settings;