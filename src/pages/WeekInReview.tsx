import { useEffect, useState } from "react";
import WeekInReviewInitial from "../components/Review/WeekInReviewInitial";
import Surveyer from "../components/Review/Surveyer";
import DASS from "../screeners/dass";
import CAGE_AID from "../screeners/cage_aid";
import SPF from "../screeners/spf";
import EDE_QS from "../screeners/ede_qs";
import HARM from "../screeners/harm";
import { auth, db } from "../firebase";
import { get, limitToLast, orderByKey, query, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import Screener from "../screeners/screener";
import WeekInReviewReview from "../components/Review/WeekInReviewReview";
import history from "../history";
import "./WeekInReview.css";

enum Stage {
    Initial,
    Primary,
    Secondary,
    Review
};

interface KEY_MAP_INT {
    [key: string]: () => Screener;
}

const KEY_MAP: KEY_MAP_INT = {
    "cagev1": CAGE_AID,
    "edev1": EDE_QS,
    "harmv1": HARM,
    "spfv1": SPF
};

const WeekInReview = () => {
    const [user] = useAuthState(auth);
    const [stage, setStage] = useState(Stage.Initial);
    const incrementStage = function() {
        setStage(stage + 1);
    };
    const [primary, setPrimary] = useState(DASS());
    const [secondary, setSecondary] = useState(SPF());

    // Figure out secondary survey based on past surveys
    useEffect(() => {
        if (!user) return;
        get(query(ref(db, `${user.uid}/surveys`), orderByKey(), limitToLast(6))).then(snap => {
            const val = snap.val();
            let keys = Object.keys(KEY_MAP);
            if (val) {
                for (let surveyKey in val) {
                    // https://eslint.org/docs/rules/guard-for-in
                    if (Object.prototype.hasOwnProperty.call(val, surveyKey)) {
                        const idx = keys.indexOf(val[surveyKey].key);
                        if (keys.length > 1 && idx !== -1) {
                            keys.splice(idx, 1);
                        }
                    }
                }
            }
            setSecondary(KEY_MAP[keys[Math.floor(Math.random() * keys.length)]]());
        });
    }, [user]);

    // Basic token check (mainly to ensure the user doesn't accidentally 
    // end up here again via browser history) 
    /*
    useEffect(() => {
        if (!localStorage.getItem("wirtoken")) {
            history.replace("/summary");
        } else {
            localStorage.removeItem("wirtoken");
        }
    }, []);
    */

    return <>
        { stage === Stage.Initial && <WeekInReviewInitial incrementStage={() => {
            setPrimary({
                ...primary,
                ...primary.nextQuestion()
            });
            incrementStage();
        }} /> }
        { stage === Stage.Primary && <Surveyer stage="Primary" survey={primary} setSurvey={setPrimary} incrementStage={() => {
            setSecondary({
                ...secondary,
                ...secondary.nextQuestion()
            });
            incrementStage();
        }} /> }
        { stage === Stage.Secondary && <Surveyer stage="Secondary" survey={secondary} setSurvey={setSecondary} incrementStage={incrementStage} /> }
        { stage === Stage.Review && <WeekInReviewReview primary={primary} secondary={secondary} />}
    </>
};

export default WeekInReview;