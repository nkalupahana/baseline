import { SCREENERS } from "./WeekInReview";
import WeekInReviewReview from "../components/Review/WeekInReviewReview";
import { useEffect, useState } from "react";
import { AnyMap, parseSurveyHistory, PullDataStates } from "../helpers";
import Screener from "../screeners/screener";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import Preloader from "./Preloader";
import DASS from "../screeners/dass";
import history from "../history";

const LastWeekInReview = () => {
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [primary, setPrimary] = useState<Screener | null>(null);
    const [secondary, setSecondary] = useState<Screener | null>(null);
    const [user] = useAuthState(auth);

    useEffect(() => {
        parseSurveyHistory(user, setSurveyHistory);
    }, [user]);
    
    useEffect(() => {
        if (surveyHistory === PullDataStates.NOT_ENOUGH_DATA) {
            history.replace("/surveys");
            return;
        }

        if (typeof surveyHistory !== "object") return;
        let surveyHistoryArr = Object.values(surveyHistory);
        surveyHistoryArr.reverse()
        
        try {
            let p = DASS();
            p._results = surveyHistoryArr.find(x => x.key === "dassv1").results;

            const sdata = surveyHistoryArr.find(x => x.key !== "dassv1");
            let s = SCREENERS[sdata.key]();
            s._results = sdata.results;
            setPrimary(p);
            setSecondary(s);
        } catch (e) {
            console.log(e);
            history.replace("/surveys");
        }
    }, [surveyHistory]);


    return <>
        { (!primary || !secondary) && <Preloader /> }
        { primary && secondary && <WeekInReviewReview primary={primary} secondary={secondary} update={false} /> }
    </>;
};

export default LastWeekInReview;