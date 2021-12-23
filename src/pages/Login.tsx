import { IonButton, IonPage } from "@ionic/react";
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import { GooglePlus } from "@awesome-cordova-plugins/google-plus";
import "./Container.css";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import ldb from '../db';

const Login = () => {
    useEffect(() => {
        ldb.logs.clear();
    }, []);

    const signInWithGoogle = async () => {
        if (Capacitor.getPlatform() === "web") {
            const google = new GoogleAuthProvider();
            signInWithPopup(auth, google);
        } else {
            GooglePlus.login({
                webClientId: "257064314002-kvgrr0turlhatbpvtin7foru6g2h1704"                    
            }).then(res => {
                signInWithCredential(auth, GoogleAuthProvider.credential(res.idToken, res.accessToken));
            });
        }
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
