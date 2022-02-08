import { useEffect, useState } from "react";
import WeekInReviewInitial from "../components/WeekInReviewInitial";
import Surveyer from "../components/Surveyer";
import DASS from "../screeners/dass";
import "./WeekInReview.css";
import CAGE_AID from "../screeners/cage_aid";
import SPF from "../screeners/spf";
import EDE_QS from "../screeners/ede_qs";
import HARM from "../screeners/harm";
import { auth, db } from "../firebase";
import { get, limitToLast, orderByKey, query, ref } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import Screener from "../screeners/screener";
import WeekInReviewReview from "../components/WeekInReviewReview";

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
    const [, loading] = useAuthState(auth);
    const [stage, setStage] = useState(Stage.Initial);
    const incrementStage = function() {
        setStage(stage + 1);
    };
    const [primary, setPrimary] = useState(DASS());
    const [secondary, setSecondary] = useState(SPF());

    useEffect(() => {
        if (loading || !auth.currentUser) return;
        get(query(ref(db, `${auth.currentUser.uid}/surveys`), orderByKey(), limitToLast(6))).then(snap => {
            const val = snap.val();
            let keys = Object.keys(KEY_MAP);
            if (val) {
                for (let surveyKey in val) {
                    const idx = keys.indexOf(val[surveyKey].key);
                    if (keys.length > 1 && idx !== -1) {
                        keys.splice(idx, 1);
                    }
                }
            }
            setSecondary(KEY_MAP[keys[Math.floor(Math.random() * keys.length)]]());
        });
    }, [loading]);

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