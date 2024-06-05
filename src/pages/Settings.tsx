import { IonAlert, IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import KeyboardSpacer from "../components/KeyboardSpacer";
import PDP from "../components/Settings/PDP";
import SettingsBox from "../components/Settings/SettingsBox";
import { auth, signOutAndCleanUp } from "../firebase";
import { goBackSafely, toast } from "../helpers";
import history from "../history";
import { DateTime } from "luxon";
import ldb from "../db";

const Settings = () => {
    const [doingAsyncTask, setDoingAsyncTask] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [user] = useAuthState(auth);
    useEffect(() => {
        if (localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd")) history.replace("/unlock");
    }, []);

    const addFakeData = useCallback(() => {
        let date = DateTime.now();
        for (let i = 0; i < 30; i++) {
            ldb.logs.add({
                timestamp: date.toMillis(),
                month: date.month,
                day: date.day,
                year: date.year,
                time: "1:00",
                zone: date.zoneName,
                average: "average",
                mood: Math.round((Math.random() * 10) - 5),
                journal: "fake",
                files: []
            })
            
            date = date.minus({ days: 1 });
        }

        toast("Added fake data!");
    }, []);

    return <div className="container">
        { !doingAsyncTask && <IonIcon className="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon> }
        { doingAsyncTask && <IonSpinner className="top-corner x loader" name="crescent" /> }
        <div className="center-journal container">
            <div className="title">Settings</div>
            <div className="br"></div>
            <div style={{"maxWidth": "600px"}}>
                { user && <SettingsBox
                    attr="introQuestions"
                    title="Practice Prompts"
                    description="Not comfortable writing about yourself this much yet? Enable practice prompts for a few weeks. (Coming soon)"
                    syncWithFirebase={`${user.uid}/onboarding/questions`}
                /> }
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
                <p className="bold margin-bottom-0">Partner Connections</p>
                <div className="br"></div><div className="br"></div>
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
                    If you'd like to delete your account, <span className="fake-link" onClick={() => setDeleteAlert(true)}>click here.</span> You'll be prompted to sign in again to confirm.
                </p>
            </div>
            <IonButton style={{"display": "none"}} mode="ios" onClick={addFakeData}>Add Local Fake Data For WIR</IonButton>
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