import { IonButton, IonPage } from "@ionic/react";
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import "./Container.css";

const Login = () => {
    const google = new GoogleAuthProvider();
    const github = new GithubAuthProvider();

    return (
        <IonPage>
            <div className="container column-flex">
                <br/><br/>
                <IonButton mode="ios" onClick={() => signInWithPopup(auth, google)}>Google</IonButton>
                <IonButton mode="ios" onClick={() => signInWithPopup(auth, github)}>Github</IonButton>
                <IonButton mode="ios" onClick={() => signInAnonymously(auth)}>Anonymous</IonButton>
            </div>
        </IonPage>
    );
};

export default Login;
