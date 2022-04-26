import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import EndSpacer from "../components/EndSpacer";
import history from "../history";

const GapFund = () => {
    return (
    <>
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.goBack()}></IonIcon>
            <div className="center-journal container">
                <div className="title">baseline Gap Fund</div>
                <p className="text-center margin-bottom-0">placeholder text</p>
            </div>
            <EndSpacer />
        </div>
    </>)
};

export default GapFund;