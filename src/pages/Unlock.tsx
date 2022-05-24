import { IonButton } from "@ionic/react"
import { useEffect } from "react";
import history from "../history";

const Unlock = () => {
    useEffect(() => {
        if (!(localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd"))) history.replace("/summary");
    }, []);

    return <>
        <br /><br /><br /><br />
        <IonButton onClick={() => {
            sessionStorage.setItem("pwd", "password");
            history.replace("/summary");
        }}>Unlock</IonButton>
    </>
}

export default Unlock;