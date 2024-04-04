import { IonButton, IonIcon, IonSpinner } from "@ionic/react";
import { GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth, db, signOutAndCleanUp } from "../firebase";
import "./Container.css";
import { useEffect, useState } from "react";
import ldb from '../db';
import { AuthCredential, FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { AnyMap, BASE_URL, fingerprint, makeRequest, networkFailure, setEkeys, setSettings, toast } from "../helpers";
import { CloudKit, SignInOptions } from "capacitor-cloudkit";
import Preloader from "./Preloader";
import UnlockCmp from "../components/Settings/UnlockCmp";
import { get, ref } from "firebase/database";
import hash from "crypto-js/sha512";
import "./Login.css";
import { lockClosed, logoApple, logoGoogle } from "ionicons/icons";
import history from "../history";
import { DateTime } from "luxon";
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";

enum LoginStates {
    START,
    LOGGING_IN,
    CLOUDKIT_NEEDED,
    GETTING_CLOUDKIT,
    UNLOCK,
    GETTING_KEYS,
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
    const [storedAdditionalData, setStoredAdditionalData] = useState<AnyMap>({});
    const [passphrase, setPassphrase] = useState("");
    const [deleting, setDeleting] = useState(false);

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
        setStoredAdditionalData({});
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
            if (Capacitor.getPlatform() === "ios") {
                let record = {};
                try {
                    record = await CloudKit.fetchRecord({
                        containerIdentifier: "iCloud.baseline.getbaseline.app",
                        database: "private",
                        by: "recordName",
                        recordName: "Keys"
                    })
                } catch {}

                if ("visibleKey" in record && "encryptedKey" in record) {
                    if (flowVal !== flow) return;
                    await continueLoginFlow(credential, flowVal, {
                        visibleKey: record["visibleKey"],
                        encryptedKey: record["encryptedKey"]
                    });
                    return;
                }
            }
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

    const continueLoginFlow = async (credential: AuthCredential, flowVal: number, additionalData={}) => {
        setLoginState(LoginStates.GETTING_KEYS);
        if (flowVal !== flow) return;

        const method = await (await get(ref(db, `/${auth.currentUser?.uid}/pdp/method`))).val();
        if (flowVal !== flow) return;
        if (method && !passphrase) {
            setStoredCredential(credential);
            setStoredAdditionalData(additionalData);
            setLoginState(LoginStates.UNLOCK);
            return;
        }

        if (flowVal !== flow) return;
        try {
            const idToken = await auth.currentUser?.getIdToken();
            if (flowVal !== flow) return;
            const keyResponse = await fetch(`${BASE_URL}/accounts/getOrCreateKeys`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    credential,
                    platform: Capacitor.getPlatform(),
                    passphrase,
                    ...additionalData
                })
            });
            
            if (flowVal !== flow) return;
            if (keyResponse?.ok) {
                const {
                    visibleKey,
                    encryptedKey,
                    encryptedKeyVisible,
                    additionalData
                } = await keyResponse.json();

                fetch(`${BASE_URL}/analytics/beacon`, {
                    method: "POST",
                    keepalive: true,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fingerprint: fingerprint(),
                        state: "signed_up",
                        uid: auth.currentUser?.uid
                    })
                });

                const data = JSON.stringify({
                    visibleKey,
                    encryptedKey,
                    encryptedKeyVisible
                });

                localStorage.setItem("offline", additionalData?.offline ?? "");

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

                const platform = Capacitor.getPlatform();
                sessionStorage.removeItem("deleteAccount");
                await makeRequest("accounts/sync", auth.currentUser!, {
                    offset: DateTime.now().offset,
                    platform
                });

                if (additionalData.introQuestions) setSettings("introQuestions", additionalData.introQuestions);
                if (platform !== "web") await FirebaseAnalytics.logEvent({ name: "sign_in"});

                if (!additionalData.onboarded) {
                    localStorage.setItem("onboarding", "start");
                    history.replace("/onboarding/start");
                } else if (platform === "web") {
                    history.replace("/journal");
                } else {
                    history.replace("/onboarding/notifications");
                }

                setLoggingIn(false);
                return;
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
                toast(`Sorry, but your iCloud storage is full, so we can't secure your data correctly. Please sign in with Google to continue.`, "top", 10000);
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
        await makeRequest("accounts/delete", auth.currentUser!, {}, setDeleting);
        resetFlow();
        toast("Your account has been deleted.");
    }

    const spacer = [LoginStates.START, LoginStates.LOGGING_IN, LoginStates.GETTING_CLOUDKIT, LoginStates.GETTING_KEYS].includes(loginState);

    return <div className="container inner-scroll">
        <div className="column-flex text-center center-summary">
            { spacer && <div className="spacer"></div> }
            { loginState === LoginStates.START && <>
                <div className="title">Welcome to baseline.</div>
                <p className="margin-top-8 margin-bottom-24">A better journaling and mood tracking app.</p>
                <div onClick={() => loginFlow(signInWithApple)} className="login-button apple"><IonIcon icon={logoApple} /><span> Sign in with Apple</span></div>
                <div onClick={() => loginFlow(signInWithGoogle)} className="login-button google margin-bottom-0"><IonIcon icon={logoGoogle} /><span> Sign in with Google</span></div>
                <div style={{"maxWidth": "400px"}}>
                    <p><IonIcon icon={lockClosed} /> Your data is private: we're a non-profit, and we have no interest in using your data for anything.</p>
                </div>
                <p style={{"fontStyle": "italic", "fontSize": "13px", "marginTop": 0}}>
                    <span className="line">By logging in, you agree 
                    to</span> <span className="line">our <a target="_blank" rel="noreferrer" href="https://getbaseline.app/terms">Terms 
                    of Use</a> and <a target="_blank" rel="noreferrer" href="https://getbaseline.app/privacy">Privacy Policy</a></span>
                </p>
                <IonButton style={{"display": "none"}} mode="ios" onClick={() => loginFlow(signInWithAnonymous)}>Anonymous (Do Not Use)</IonButton>
            </> }
            { (loginState === LoginStates.LOGGING_IN || loginState === LoginStates.GETTING_CLOUDKIT)  && <>
                <Preloader spacing={false} message="Logging in, please wait." />
                <div className="br"></div>
                <p style={{"marginBottom": "4px"}}>Been stuck here for over a minute?</p>
                <div className="fake-link" onClick={resetFlow}>Click here to try again.</div>
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
                    continueLoginFlow(storedCredential!, flow, storedAdditionalData);
                }} getter={passphrase} setter={setPassphrase} />
                <p>Stuck? <span className="fake-link" onClick={resetFlow}>Click here to start over.</span></p>
            </> }
            { loginState === LoginStates.GETTING_KEYS && <>
                <Preloader spacing={false} message="One moment! We're getting your encryption keys." />
                <div className="br"></div>
                <p style={{"marginBottom": "4px"}}>Been stuck here for over a minute?</p>
                <div className="fake-link" onClick={resetFlow}>Click here to try again.</div>
            </> }
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
