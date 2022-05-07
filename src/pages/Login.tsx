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

const cloudKitOpts: SignInOptions = {
    containerIdentifier: "iCloud.baseline.getbaseline.app",
    environment: "development",
    ckAPIToken: "d894131229c2c6c118a6a61df792e0cd2279022205f88fbb89c0c0f97ce5deed"
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

        if (credential.providerId === "apple.com") {
            if (Capacitor.getPlatform() === "ios") {
                credential.accessToken = (await CloudKit.authenticate(cloudKitOpts)).ckWebAuthToken;
            } else {
                setLoginState(LoginStates.CLOUDKIT_NEEDED);
                setStoredCredential(credential);
                return;
            }
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
        console.log(credential);
        console.log(await auth.currentUser?.getIdToken());
        try {
            const keyResponse = await fetch("https://us-central1-getbaselineapp.cloudfunctions.net/getOrCreateKeys", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${await auth.currentUser?.getIdToken()}`,
                },
                body: JSON.stringify({
                    credential
                })
            });

            if (keyResponse && keyResponse.ok) {
                localStorage.setItem("keys", JSON.stringify(await keyResponse.json()));
                setLoggingIn(false);
            } else {
                throw new Error(`Something went wrong, please try again! ${await keyResponse.text()}`);
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

    const signInWithGithub = async () => {
        const result = await FirebaseAuthentication.signInWithGithub({
            scopes: ["user:email", "gist"]
        });
        alert("done");
        console.log(result);

        throw Error("No tokens?");
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
            <div className="container column-flex">
                <br/><br/>
                { loginState === LoginStates.START && <>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithGoogle)}>Google</IonButton>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithApple)}>Apple</IonButton>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithGithub)}>GitHub</IonButton>
                    <IonButton mode="ios" onClick={() => loginFlow(signInWithAnonymous)}>Anonymous</IonButton>
                </> }
                { (loginState === LoginStates.LOGGING_IN || loginState === LoginStates.GETTING_CLOUDKIT)  && <>
                    <Preloader message="Logging in, please wait." />
                    <br />
                    <p>Been stuck here for over a minute? <span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
                </> }
                { loginState === LoginStates.CLOUDKIT_NEEDED && <>
                    <IonButton mode="ios" onClick={signInWithCloudKit}>Apple, Again</IonButton>
                </> }
                { loginState === LoginStates.GETTING_KEYS && <>
                    <Preloader message="One second! We're getting your encryption keys." />
                    <br />
                    <p>Been stuck here for over a minute? <span className="fake-link" onClick={resetFlow}>Click here to try again.</span></p>
                </> }
            </div>
        </IonPage>
    );
};

export default Login;
