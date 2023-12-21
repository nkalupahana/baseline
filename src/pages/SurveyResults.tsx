import { IonIcon, IonSpinner } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import SurveyGraph from "../components/Review/SurveyGraph";
import { RESILIENCE_EXP } from "../data";
import { auth } from "../firebase";
import { AnyMap, PullDataStates, BASELINE_GRAPH_CONFIG, calculateBaseline, parseSurveyHistory } from "../helpers";
import history from "../history";
import DASS from "../screeners/dass";
import SPF from "../screeners/spf";
import DASSGraph from "../components/graphs/DASSGraph";
import { DateTime } from "luxon";
import { ONE_DAY } from "../components/graphs/graph-helpers";

const SurveyResults = () => {
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | PullDataStates>(PullDataStates.NOT_STARTED);
    const [showLastWeek, setShowLastWeek] = useState(false);
    const now = useMemo(() => {
        return DateTime.now().toMillis();
    }, []);
    const [xZoomDomain, setXZoomDomain] = useState<undefined | [number, number]>([now - ONE_DAY * 180, now]);
    const dass = DASS();
    const spf = SPF();    

    useEffect(() => {
        parseSurveyHistory(user, setSurveyHistory);
    }, [user])

    useEffect(() => {
        calculateBaseline(setBaselineGraph);
    }, []);
    
    useEffect(() => {
        if (typeof surveyHistory !== "object") return;
        const values = Object.values(surveyHistory);
        if (values.findIndex(x => x.key === "dassv1") === -1) return;
        if (values.findIndex(x => x.key !== "dassv1") === -1) return;
        setShowLastWeek(true);
    }, [surveyHistory]);

    return (
        <div className="container">
            <IonIcon className="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">Survey Results</div>
                <br />
                { showLastWeek && <div className="finish-button" onClick={() => history.push("/lastreview")} style={{"width": "80%", "maxWidth": "500px"}}>
                    View Last Week's Results
                </div> }
                <p className="bold head2 text-center">Your baseline</p>
                { typeof baselineGraph === "object" && <>
                    <SurveyGraph data={baselineGraph} graphConfig={BASELINE_GRAPH_CONFIG} />
                    <p className="text-center margin-bottom-0 max-width-600">
                        Your baseline tracks your "average" mood, so you can 
                        see how your base level of happiness changes over time. (The numbers 
                        don't mean anything by themselves, so don't compare this graph with other 
                        people. What matters is how <i>your</i> baseline changes as time goes on.)
                    </p>
                    <p className="text-center margin-bottom-0 max-width-600">
                        Notice your baseline falling? You might want to make a conscious effort to bring more things 
                        into your life that you typically associate with higher mood scores.
                    </p>
                </> }
                { baselineGraph === PullDataStates.NOT_STARTED && <IonSpinner className="loader" name="crescent" /> }
                { baselineGraph === PullDataStates.NOT_ENOUGH_DATA && <p className="text-center margin-0">We don't have enough data to calculate your baseline. Check back in later!</p>}
                <br />
                { surveyHistory === PullDataStates.NOT_STARTED && <IonSpinner className="loader" name="crescent" /> }
                { surveyHistory === PullDataStates.NOT_ENOUGH_DATA && <p className="text-center">As you complete surveys each week, more data will show up here.</p>}
                { typeof surveyHistory === "object" && <>
                    <p className="bold head2 text-center">Depression, Anxiety, and Stress Levels</p>
                    <DASSGraph xZoomDomain={xZoomDomain} setXZoomDomain={setXZoomDomain} data={dass.processDataForGraph!(surveyHistory)} now={now} />
                    <br />
                    <p className="bold head2 text-center">Resilience</p>
                    <SurveyGraph data={spf.processDataForGraph!(surveyHistory)} graphConfig={spf.graphConfig!} /> 
                    <p className="text-center margin-bottom-0 max-width-600">{ RESILIENCE_EXP }</p>
                </> }
                <EndSpacer />
            </div>
        </div>
    );
};

export default SurveyResults;
