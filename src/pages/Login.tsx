import { IonButton, IonPage } from "@ionic/react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import "./Container.css";
import { useEffect } from "react";
import ldb from '../db';
import { FirebaseAuthentication } from '@robingenz/capacitor-firebase-authentication';

const Login = () => {
    useEffect(() => {
        ldb.logs.clear();
    }, []);

    const signInWithGoogle = async () => {
        FirebaseAuthentication.signInWithGoogle();
    }

    return (
        <IonPage>
            <div className="container column-flex">
                <br/><br/>
                <IonButton mode="ios" onClick={signInWithGoogle}>Google</IonButton>
                <IonButton mode="ios" onClick={() => signInAnonymously(auth)}>Anonymous</IonButton>
            </div>
        </IonPage>
    );
};

export default Login;
