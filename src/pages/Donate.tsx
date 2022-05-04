import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import history from "../history";

const Donate = () => {
    return (<div className="container">
        <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.length > 2 ? history.goBack() : history.push("/summary")}></IonIcon>
        <div className="center-journal container">
            <div className="title">Donate!</div>
            <p>placeholder text</p>
        </div>
    </div>);
}

export default Donate;