import { IonItem, IonLabel } from "@ionic/react";
import { useEffect, useState } from "react";
import history from "../history";
import hash from "crypto-js/sha512";
import { toast } from "../helpers";
import AES from "crypto-js/aes";
import aesutf8 from "crypto-js/enc-utf8";

const Unlock = () => {
    const [passphrase, setPassphrase] = useState("");
    useEffect(() => {
        if (!(localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd"))) history.replace("/summary");
    }, []);

    const unlock = () => {
        const keyData = JSON.parse(localStorage.getItem("ekeys") ?? "{}");
        const h = hash(passphrase).toString();
        if (hash(AES.decrypt(keyData.keys, h).toString(aesutf8)).toString() === keyData.hash) {
            sessionStorage.setItem("pwd", h);
            history.replace("/summary");
        } else {
            toast("Your passphrase is incorrect, please try again.");
        }
    };

    return <>
        <div style={{ gridArea: "heading" }} className="center-summary">
            <div className="title">Unlock</div>
            <br />
            <div style={{"width": "100%", "maxWidth": "600px"}}>
                <form>
                    <IonItem>
                        <IonLabel className="ion-text-wrap" position="stacked">Passphrase</IonLabel>
                        <input autoComplete="new-password" className="invisible-input" value={passphrase} type="password" onChange={e => setPassphrase(e.target.value)} />
                    </IonItem>
                </form>
                <br /><br />
                <div className="finish-button" onClick={unlock}>
                    Submit
                </div>
            </div>
        </div>
    </>
}

export default Unlock;