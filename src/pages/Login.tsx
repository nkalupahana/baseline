import { IonButton, IonPage } from "@ionic/react";
import { GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import "./Container.css";
import { useEffect } from "react";
import ldb from '../db';
import { FirebaseAuthentication } from '@moody-app/capacitor-firebase-authentication';
import { Capacitor } from "@capacitor/core";

const Login = () => {
    useEffect(() => {
        ldb.logs.clear();
    }, []);

    const signInWithGoogle = async () => {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (Capacitor.getPlatform() !== "web") signInWithCredential(auth, GoogleAuthProvider.credential(result.credential?.idToken));
    }

    const signInWithApple = async () => {
        const result = await FirebaseAuthentication.signInWithApple();
        if (Capacitor.getPlatform() !== "web") {
            signInWithCredential(auth, new OAuthProvider("apple.com").credential({
                idToken: result.credential?.idToken,
                rawNonce: result.credential?.nonce
            }));
        }
    }

    return (
        <IonPage>
            <div className="container column-flex">
                <br/><br/>
                <IonButton mode="ios" onClick={signInWithGoogle}>Google</IonButton>
                <IonButton mode="ios" onClick={signInWithApple}>Apple</IonButton>
                <IonButton mode="ios" onClick={() => signInAnonymously(auth)}>Anonymous</IonButton>
            </div>
        </IonPage>
    );
};

export default Login;
