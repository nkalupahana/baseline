import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth, db, signOutAndCleanUp } from "../firebase";
import "./Container.css";
import { useEffect, useState } from "react";
import ldb from '../db';
import { AuthCredential, FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { makeRequest, networkFailure, setEkeys, setSettings, toast } from "../helpers";
import { CloudKit, SignInOptions } from "capacitor-cloudkit";
import Preloader from "./Preloader";
import UnlockCmp from "../components/Settings/UnlockCmp";
import { get, ref } from "firebase/database";
import hash from "crypto-js/sha512";
import "./Login.css";
import MarketingBox from "../components/Login/MarketingBox";
import { analytics, globeOutline, lockClosedOutline, logoApple, logoGoogle, pencilOutline } from "ionicons/icons";
import Notifications from "./Notifications";
import { FirebaseMessaging } from "@getbaseline/capacitor-firebase-messaging";
import history from "../history";
import { DateTime } from "luxon";
import { Device } from "@capacitor/device";

enum LoginStates {
    START,
    LOGGING_IN,
    CLOUDKIT_NEEDED,
    GETTING_CLOUDKIT,
    UNLOCK,
    GETTING_KEYS,
    SET_NOTIFICATIONS,
    DELETE_ACCOUNT
}

const TOKENS: any = {
    web: "d43e4a0f0eac5ab776190238b97c415e847d045760d3608d75994379dd02a565",
    android: "07441aa58144eecb74f973795899f223e06a8306d109cfd496aa59372d5a200f",
    ios: "2a0a11d8b842c93e6e14c7a0e00cd7d9d2afac12917281a9f8ae845c17d4fc4a"
};

const cloudKitOpts: SignInOptions = {
    containerIdentifier: "iCloud.baseline.getbaseline.app",
    environment: "production",
    ckAPIToken: TOKENS[Capacitor.getPlatform()]
};

// Login Flow Guard
// If the user cancels login, we want to exit the login flow
// as quickly as possible. The flow guard gives a unique ID to
// each login flow, forcing an exit if the flow is interrupted.
let flow = Math.random();

const Login = ({ setLoggingIn } : { setLoggingIn: (_: boolean) => void }) => {
    const [loginState, setLoginState] = useState<LoginStates>(LoginStates.START);
    const [storedCredential, setStoredCredential] = useState<AuthCredential | null>(null);
    const [passphrase, setPassphrase] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [fcmLoading, setFcmLoading] = useState(false);

    useEffect(() => {
        ldb.logs.clear();
        history.replace("/");
    }, []);

    const resetFlow = () => {
        flow = Math.random();
        setLoggingIn(false);
        setLoginState(LoginStates.START);
        setPassphrase("");
        signOutAndCleanUp();
    }

    const loginFlow = async (signInFunc: (flowVal: number) => Promise<AuthCredential | null | undefined>) => {
        const flowVal = Math.random();
        flow = flowVal;
        setLoggingIn(true);
        setLoginState(LoginStates.LOGGING_IN);
        let credential: AuthCredential | null | undefined;
        try {
            credential = await signInFunc(flowVal);
            
            if (flowVal !== flow) return;
            if (!credential) throw Error("Your sign in didn't go through. Please try again!");
        } catch (e: any) {
            if (flowVal !== flow) return;
            toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            resetFlow();
            return;
        }

        setStoredCredential(credential);
        // Second round of auth needed on apple devices
        if (credential.providerId === "apple.com") {
            if (flowVal !== flow) return;
            setLoginState(LoginStates.CLOUDKIT_NEEDED);
            return;
        }

        await continueLoginFlow(credential, flowVal);
    }

    const signInWithCloudKit = async () => {
        const flowVal = flow;
        setLoginState(LoginStates.GETTING_CLOUDKIT);
        let credential: AuthCredential;
        try {
            credential = JSON.parse(JSON.stringify(storedCredential));
            credential.accessToken = (await CloudKit.authenticate(cloudKitOpts)).ckWebAuthToken;
        } catch (e: any) {
            if (flowVal !== flow) return;
            toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            setLoginState(LoginStates.CLOUDKIT_NEEDED);
            return;
        }

        await continueLoginFlow(credential, flowVal);
    }

    const continueLoginFlow = async (credential: AuthCredential, flowVal: number) => {
        setLoginState(LoginStates.GETTING_KEYS);
        if (flowVal !== flow) return;

        const method = await (await get(ref(db, `/${auth.currentUser?.uid}/pdp/method`))).val();
        if (flowVal !== flow) return;
        if (method && !passphrase) {
            setLoginState(LoginStates.UNLOCK);
            return;
        }

        if (flowVal !== flow) return;
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (flowVal !== flow) return;
            const keyResponse = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/getOrCreateKeys", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    credential,
                    platform: Capacitor.getPlatform(),
                    passphrase
                })
            });
            
            if (flowVal !== flow) return;
            if (keyResponse?.ok) {
                const data = JSON.stringify(await keyResponse.json());

                if (flowVal !== flow) return;
                if (passphrase) {
                    setEkeys(data, hash(passphrase).toString());
                    setSettings("pdp", method);
                    const update = await (await get(ref(db, `/${auth.currentUser?.uid}/pdp/passphraseUpdate`))).val();
                    setSettings("passphraseUpdate", update);
                } else {
                    localStorage.setItem("keys", data);
                }

                if (sessionStorage.getItem("deleteAccount") && sessionStorage.getItem("deleteAccount") === auth.currentUser?.uid) {
                    setLoginState(LoginStates.DELETE_ACCOUNT);
                    return;
                }

                sessionStorage.removeItem("deleteAccount");
                if (Capacitor.getPlatform() === "web") {
                    await makeRequest("syncUserInfo", auth.currentUser!, {
                        offset: DateTime.now().offset,
                    });
                    setLoggingIn(false);
                } else {
                    setFcmLoading(false);
                    setLoginState(LoginStates.SET_NOTIFICATIONS);
                }
            } else if (keyResponse?.status === 401) {
                if (flowVal !== flow) return;
                toast(await keyResponse.text());
                setLoginState(LoginStates.UNLOCK);
            } else if (keyResponse?.status === 428) {
                if (flowVal !== flow) return;
                toast("Sorry, but we need you to sign in one more time!");
                resetFlow();
                return;
            } else if (keyResponse?.status === 406) {
                if (flowVal !== flow) return;
                toast(`Sorry, but there's something wrong with your iCloud account, so we can't 
                    secure your data correctly. You'll have you sign in with Google. Sorry for the
                    inconvenience, but this unfortunately isn't in our control.`, "top", 10000);
                resetFlow();
                return;
            } else {
                throw new Error(`${keyResponse ? await keyResponse.text() : ""}`);
            }
        } catch (e: any) {
            if (flowVal !== flow) return;
            if (networkFailure(e.message)) {
                toast("We're having trouble reaching our servers. Make sure you're connected to the Internet.");
            } else {
                toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            }

            if (flowVal !== flow) return;
            resetFlow();
            return;
        }
    }

    const signInWithGoogle = async (flowVal: number) => {
        if (flowVal !== flow) return;
        const result = await FirebaseAuthentication.signInWithGoogle({
            scopes: ["https://www.googleapis.com/auth/drive.appdata"]
        });

        if (Capacitor.getPlatform() !== "web") {
            if (flowVal !== flow) return;
            await signInWithCredential(auth, GoogleAuthProvider.credential(result.credential?.idToken));
        }

        return result.credential;
    }

    const signInWithApple = async (flowVal: number) => {
        if (flowVal !== flow) return;
        const result = await FirebaseAuthentication.signInWithApple();

        if (Capacitor.getPlatform() !== "web") {
            if (flowVal !== flow) return;
            await signInWithCredential(auth, new OAuthProvider("apple.com").credential({
                idToken: result.credential?.idToken,
                rawNonce: result.credential?.nonce
            }));
        }

        return result.credential;
    }

    const signInWithAnonymous = async (flowVal: number) => {
        if (flowVal !== flow) return;
        await signInAnonymously(auth);
        
        return {
            providerId: "anonymous",
            accessToken: "anonymous"
        };
    }

    const deleteAccount = async () => {
        sessionStorage.removeItem("deleteAccount");
        setDeleting(true);
        await makeRequest("deleteAccount", auth.currentUser!, {}, setDeleting);
        resetFlow();
        toast("Your account has been deleted.");
    }

    const finishSignIn = async () => {
        setFcmLoading(true);
        try {
            await FirebaseMessaging.requestPermissions();
            const token = await FirebaseMessaging.getToken();
            await makeRequest("syncUserInfo", auth.currentUser!, {
                offset: DateTime.now().offset,
                fcmToken: token,
                deviceId: (await Device.getId()).uuid
            });
            await FirebaseMessaging.subscribeToTopic({ topic: "all" });
        } catch {}
        setLoggingIn(false);
    }

    return <div className="container inner-scroll">
            <div className="column-flex text-center center-summary">
            { loginState === LoginStates.START && <>
                <div className="title">Welcome to baseline.</div>
                <div className="marketing">
                    <MarketingBox 
                        icon={pencilOutline} 
                        title={"Understand your brain."}
                        description={"Journaling on baseline is designed to help you understand yourself better. By mood tracking, you'll start to get a better feel for who you are and what you need to become healthier."} />
                    <MarketingBox
                        icon={analytics}
                        title={"Track your progress."}
                        description={"Use baseline's visualizations to help you better understand your mood over time. You'll also get a chance to review your progress and overall health 'baseline' at the end of each week."} />
                    <MarketingBox 
                        icon={lockClosedOutline} 
                        title={"Protect your data."}
                        description={"We encrypt your data so that not even we can see it. You can also set a passphrase in-app to hide your data from people who might have access to your device."} />
                    <MarketingBox 
                        icon={globeOutline} 
                        title={"Access your journals anywhere."}
                        description={<>All of your mood logs can be accessed at any time on { Capacitor.getPlatform() === "ios" ? <>your device,</> : <>iOS, Android,</> } and <a href="https://web.getbaseline.app" target="_blank" rel="noreferrer">online</a>.</>} />
                </div>
                <div onClick={() => loginFlow(signInWithApple)} className="login-button apple"><IonIcon icon={logoApple} /><span> Sign in with Apple</span></div>
                <div onClick={() => loginFlow(signInWithGoogle)} className="login-button google margin-bottom-0"><IonIcon icon={logoGoogle} /><span> Sign in with Google</span></div>
                <p style={{"fontStyle": "italic", "fontSize": "13px", "marginTop": 0}}>
                    By logging in, you agree to 
                    our <a target="_blank" rel="noreferrer" href="https://getbaseline.app/terms">Terms of Use</a>&nbsp;
                    and <a target="_blank" rel="noreferrer" href="https://getbaseline.app/privacy">Privacy Policy</a></p>
                <IonButton style={{"display": "none"}} mode="ios" onClick={() => loginFlow(signInWithAnonymous)}>Anonymous (Do Not Use)</IonButton>
            </> }
            { (loginState === LoginStates.LOGGING_IN || loginState === LoginStates.GETTING_CLOUDKIT)  && <>
                <Preloader message="Logging in, please wait." />
                <br />
                <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
            </> }
            { loginState === LoginStates.CLOUDKIT_NEEDED && <div style={{"maxWidth": "500px"}}>
                <div className="title">One more time!</div>
                <p className="margin-bottom-0">To properly secure your data with iCloud, we need you to sign in one more time. You'll be ready to go after that, though!</p>
                <p>Having issues? Email us at <a href="mailto:hello@getbaseline.app">hello@getbaseline.app</a>.</p>
                <IonButton mode="ios" onClick={signInWithCloudKit}>Sign In</IonButton>
            </div> }
            { loginState === LoginStates.UNLOCK && <>
                <UnlockCmp unlock={e => {
                    e.preventDefault();
                    continueLoginFlow(storedCredential!, flow);
                }} getter={passphrase} setter={setPassphrase} />
                <p>Stuck? <span className="fake-link" onClick={resetFlow}>Click here to start over.</span></p>
            </> }
            { loginState === LoginStates.GETTING_KEYS && <>
                <Preloader message="One moment! We're getting your encryption keys." />
                <br />
                <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
            </> }
            { loginState === LoginStates.SET_NOTIFICATIONS && <Notifications page={false} fcmLoading={fcmLoading} finishSignIn={finishSignIn} /> }
            { loginState === LoginStates.DELETE_ACCOUNT && <div style={{"maxWidth": "500px"}}>
                <div className="title">Delete Account?</div>
                <p>
                    If you're sure you'd like to delete your account, click the delete button below. Your data will
                    be irreversibly lost. This cannot be undone. Otherwise, click <span onClick={() => {
                        sessionStorage.removeItem("deleteAccount");
                        resetFlow();
                        toast("Account deletion cancelled.");
                    }} className="fake-link">here</span> to cancel account deletion.
                </p>
                <div className="finish-button" onClick={deleteAccount}>
                    { !deleting && <>Delete Account</> }
                    { deleting && <IonSpinner className="loader" name="crescent" /> }
                </div>
            </div> }
        </div>
    </div>;
};

export default Login;
