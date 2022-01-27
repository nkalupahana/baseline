import { IonSpinner } from "@ionic/react";
import { ref, set } from "firebase/database";
import { DateTime } from "luxon";
import { useState } from "react";
import { auth, db } from "../firebase";
import history from "../history";

const WeekInReviewReview = () => {
    const [loading, setLoading] = useState(false);
    const finish = async () => {
        if (loading) return;
        setLoading(true);
        await set(ref(db, `/${auth?.currentUser?.uid}/lastWeekInReview`), DateTime.utc().toMillis());
        history.push("/summary");
    };

    return (<div className="center-summary">
            <br /><br />
            <div className="finish-button" onClick={finish}>
                { !loading && <>Finish</> }
                { loading && <IonSpinner className="loader" name="crescent" /> }
            </div>
        </div>);
}

export default WeekInReviewReview;