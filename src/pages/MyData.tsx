import { IonIcon } from "@ionic/react";
import ExportData from "../components/MyData/ExportData";
import { closeOutline } from "ionicons/icons";
import { checkKeys, goBackSafely } from "../helpers";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";
import history from "../history";
import EndSpacer from "../components/EndSpacer";

const MyData = () => {
    const [user] = useAuthState(auth);
    const [showKeys, setShowKeys] = useState(false);
    const keys = checkKeys();
    useEffect(() => {
        if (localStorage.getItem("ekeys") && !sessionStorage.getItem("pwd")) history.replace("/unlock");
    }, []);

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={goBackSafely}></IonIcon>
            <div className="center-journal container">
                <div className="title">My Data</div>
                <div style={{"maxWidth": "600px"}}>
                    <p className="bold">Export Journal Data</p>
                    <p>Select the data you would like to export:</p>
                    <ExportData />
                    <p>
                        For a full copy of your data, or to exercise any of your data privacy rights, email us at <a href="mailto:privacy@getbaseline.app">privacy@getbaseline.app.</a>
                    </p>
                    <p className="bold">Technical Details</p>
                    { user && <p data-happo-hide className="small-text margin-bottom-0 margin-top-8">UID: { user.uid }</p> }
                    { typeof keys === "object" && <p className="fake-link small-text" onClick={() => setShowKeys(!showKeys)}>{ showKeys ? "Hide" : "Show"} Encryption Keys</p>}
                    { showKeys && <>
                        <p className="small-text margin-bottom-0 margin-top-8">These are the keys to all of your private information.
                        Not even we have them. Never give these to anyone, no matter how nicely they ask. Ever.</p>
                        <p data-happo-hide className="small-text margin-bottom-0 margin-top-8">Visible Key: { keys.visibleKey }</p> 
                        <p data-happo-hide style={{"overflowWrap": "anywhere"}} className="small-text margin-top-8">Encrypted Key (Visible): { keys.encryptedKeyVisible }</p>
                    </> }
                </div>
                <EndSpacer />
            </div>
        </div>
    )
}

export default MyData;