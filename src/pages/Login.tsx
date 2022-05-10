import { IonButton, IonPage } from "@ionic/react";
import { GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth, signOutAndCleanUp } from "../firebase";
import "./Container.css";
import { useEffect, useState } from "react";
import ldb from '../db';
import { AuthCredential, FirebaseAuthentication } from "@moody-app/capacitor-firebase-authentication";
import { Capacitor } from "@capacitor/core";
import { FCM } from "@capacitor-community/fcm";
import { PushNotifications } from "@moody-app/capacitor-push-notifications";
import { networkFailure, toast } from "../helpers";
import { CloudKit, SignInOptions } from "capacitor-cloudkit";
import Preloader from "./Preloader";

enum LoginStates {
    START,
    LOGGING_IN,
    CLOUDKIT_NEEDED,
    GETTING_CLOUDKIT,
    GETTING_KEYS
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

const Login = ({ setLoggingIn } : { setLoggingIn: (_: boolean) => void }) => {
    const [loginState, setLoginState] = useState<LoginStates>(LoginStates.START);
    const [storedCredential, setStoredCredential] = useState<AuthCredential | null>(null);

    useEffect(() => {
        ldb.logs.clear();
    }, []);

    const resetFlow = () => {
        signOutAndCleanUp();
        setLoggingIn(false);
        setLoginState(LoginStates.START);
    }

    const loginFlow = async (signInFunc: () => Promise<AuthCredential | null>) => {
        setLoggingIn(true);
        setLoginState(LoginStates.LOGGING_IN);
        let credential: AuthCredential | null;
        try {
            credential = await signInFunc();
            if (!credential) throw Error("Your sign in didn't go through. Please try again!");
        } catch (e: any) {
            toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            resetFlow();
            return;
        }

        // Second round of auth needed on apple devices
        if (credential.providerId === "apple.com") {
            setLoginState(LoginStates.CLOUDKIT_NEEDED);
            setStoredCredential(credential);
            return;
        }

        await continueLoginFlow(credential);
    }

    const signInWithCloudKit = async () => {
        setLoginState(LoginStates.GETTING_CLOUDKIT);
        let credential: AuthCredential;
        try {
            credential = JSON.parse(JSON.stringify(storedCredential));
            credential.accessToken = (await CloudKit.authenticate(cloudKitOpts)).ckWebAuthToken;
        } catch (e: any) {
            toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            setLoginState(LoginStates.CLOUDKIT_NEEDED);
            return;
        }

        await continueLoginFlow(credential);
    }

    const continueLoginFlow = async (credential: AuthCredential) => {
        setLoginState(LoginStates.GETTING_KEYS);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const keyResponse = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/getOrCreateKeys", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    credential,
                    platform: Capacitor.getPlatform()
                })
            });

            if (keyResponse && keyResponse.ok) {
                if (await auth.currentUser?.getIdToken() === idToken) {
                    localStorage.setItem("keys", JSON.stringify(await keyResponse.json()));
                    setLoggingIn(false);
                }
            } else {
                throw new Error(`Something went wrong, please try again! ${keyResponse ? await keyResponse.text() : ""}`);
            }
        } catch (e: any) {
            if (networkFailure(e.message)) {
                toast("We're having trouble reaching our servers. Make sure you're connected to the Internet.");
            } else {
                toast(`Something went wrong, please try again! Make sure you're connected to the Internet. ${e.message}`);
            }

            resetFlow();
            return;
        }
    }

    const signInWithGoogle = async () => {
        const result = await FirebaseAuthentication.signInWithGoogle({
            scopes: ["https://www.googleapis.com/auth/drive.appdata"]
        });

        if (Capacitor.getPlatform() !== "web") {
            await setUpFCM();
            await signInWithCredential(auth, GoogleAuthProvider.credential(result.credential?.idToken));
        }

        return result.credential;
    }

    const signInWithApple = async () => {
        const result = await FirebaseAuthentication.signInWithApple();
        if (Capacitor.getPlatform() !== "web") {
            await setUpFCM();
            await signInWithCredential(auth, new OAuthProvider("apple.com").credential({
                idToken: result.credential?.idToken,
                rawNonce: result.credential?.nonce
            }));
        }

        return result.credential;
    }

    const signInWithAnonymous = async () => {
        if (Capacitor.getPlatform() !== "web") await setUpFCM();
        await signInAnonymously(auth);

        return {
            providerId: "anonymous",
            accessToken: "anonymous"
        };
    }

    const setUpFCM = async () => {
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        PushNotifications.addListener("registration", _ => {
            FCM.subscribeTo({ topic: "all" });
        });
    }

    return (
        <IonPage>
            <div className="container column-flex text-center center-summary">
                { loginState === LoginStates.START && <>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithGoogle)}>Google</IonButton>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithApple)}>Apple</IonButton>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithAnonymous)}>Anonymous</IonButton>
                </> }
                { (loginState === LoginStates.LOGGING_IN || loginState === LoginStates.GETTING_CLOUDKIT)  && <>
                    <Preloader message="Logging in, please wait." />
                    <br />
                    <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
                </> }
                { loginState === LoginStates.CLOUDKIT_NEEDED && <div style={{"maxWidth": "500px"}}>
                    <div className="title">One more time!</div>
                    <p className="margin-bottom-0">To properly secure your data with iCloud, we need you to sign in one more time. You'll be ready to go after that, though!</p>
                    <p>Sign in with Apple is still in beta. Having issues? Email us at <a href="mailto:hello@getbaseline.app">hello@getbaseline.app</a>.</p>
                    <IonButton mode="ios" onClick={signInWithCloudKit}>Sign In</IonButton>
                </div> }
                { loginState === LoginStates.GETTING_KEYS && <>
                    <Preloader message="One moment! We're getting your encryption keys." />
                    <br />
                    <p>Been stuck here for over a minute?<br /><span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
                </> }
            </div>
        </IonPage>
    );
};

export default Login;
