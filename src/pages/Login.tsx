import { IonButton, IonPage } from "@ionic/react";
import { GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import "./Container.css";
import { useEffect } from "react";
import ldb from '../db';
import { FirebaseAuthentication } from '@moody-app/capacitor-firebase-authentication';
import { Capacitor } from "@capacitor/core";
import { FCM } from "@capacitor-community/fcm";
import { PushNotifications } from "@capacitor/push-notifications";

const Login = () => {
    useEffect(() => {
        ldb.logs.clear();
    }, []);

    const signInWithGoogle = async () => {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (Capacitor.getPlatform() !== "web") {
            await setUpFCM();
            signInWithCredential(auth, GoogleAuthProvider.credential(result.credential?.idToken));
        }
    }

    const signInWithApple = async () => {
        const result = await FirebaseAuthentication.signInWithApple();
        if (Capacitor.getPlatform() !== "web") {
            await setUpFCM();
            signInWithCredential(auth, new OAuthProvider("apple.com").credential({
                idToken: result.credential?.idToken,
                rawNonce: result.credential?.nonce
            }));
        }
    }

    const signInWithAnonymous = async () => {
        if (Capacitor.getPlatform() !== "web") await setUpFCM();
        signInAnonymously(auth);
    }

    const setUpFCM = async () => {
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        PushNotifications.addListener("registration", token => {
            FCM.subscribeTo({ topic: "all" });
        });
    }

    return (
        <IonPage>
            <div className="container column-flex">
                <br/><br/>
                <IonButton mode="ios" onClick={signInWithGoogle}>Google</IonButton>
                <IonButton mode="ios" onClick={signInWithApple}>Apple</IonButton>
                <IonButton mode="ios" onClick={signInWithAnonymous}>Anonymous</IonButton>
            </div>
        </IonPage>
    );
};

export default Login;
