import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import EndSpacer from "../components/EndSpacer";
import Help from "../components/Help";
import history from "../history";

const GetHelp = () => {
    return (<div className="container">
        <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
        <div className="center-journal">
        <div className="container-desktop">
            <div className="title">
                Hi there.
            </div>
            <p className="text-center margin-bottom-0">Take a minute to breathe, and read through this. We're here for you.</p>
            <Help />
            <EndSpacer />
        </div>
        </div>
    </div>);
};

export default GetHelp;