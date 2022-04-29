import { IonSpinner } from "@ionic/react";
import { ref, serverTimestamp, set } from "firebase/database";
import { useState } from "react";
import { auth, db } from "../../firebase";
import history from "../../history";
import Screener from "../../screeners/screener";

interface Props {
    primary: Screener,
    secondary: Screener,
}

const WeekInReviewReview = (props: Props) => {
    const [loading, setLoading] = useState(false);
    const finish = async () => {
        if (loading) return;
        setLoading(true);
        await set(ref(db, `/${auth?.currentUser?.uid}/lastWeekInReview`), serverTimestamp());
        history.push("/summary");
    };

    return (<div className="center-summary container">
            <br />
            <p>{ props.primary.getClinicalInformation() }</p>
            <p>{ props.secondary.getClinicalInformation() }</p>
            <div className="finish-button" onClick={finish}>
                { !loading && <>Finish</> }
                { loading && <IonSpinner className="loader" name="crescent" /> }
            </div>
        </div>);
}

export default WeekInReviewReview;