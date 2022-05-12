import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { goBackSafely } from "../helpers";

const Donate = () => {
    return (<div className="container">
        <IonIcon class="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
        <div className="center-journal container">
            <div className="title">Donate!</div>
            <p>placeholder text</p>
        </div>
    </div>);
}

export default Donate;