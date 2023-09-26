import { IonIcon, IonSpinner, IonSelect, IonSelectOption } from "@ionic/react";
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
import { time } from "console";

const SurveyResults = () => {
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | PullDataStates>(PullDataStates.NOT_STARTED);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | PullDataStates>(PullDataStates.NOT_STARTED);
    const [showLastWeek, setShowLastWeek] = useState(false);
    const [timeframe, setTimeframe] = useState<string>("0100");
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

    // Converts a timeframe string (e.g. "0100") to an object with years and months
    // Value of ionselect cannot be an object, so we need to store it as a string and convert it 
    // before passing it to calculateBaseline
    const toTimeframe = (input: string) => {
        return {
            years: Number(input.substring(0, 2)),
            months: Number(input.substring(2, 4))
        }
    }

    useMemo(() => {
        calculateBaseline(setBaselineGraph, toTimeframe(timeframe));
    }, [timeframe]);


    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">Survey Results</div>
                <br />
                { showLastWeek && <div className="finish-button" onClick={() => history.push("/lastreview")} style={{"width": "80%", "maxWidth": "500px"}}>
                    View Last Week's Results
                </div> }
                <p className="bold head2 text-center">Your baseline</p>
                { typeof baselineGraph === "object" && <>
                    <IonSelect onIonChange={e => setTimeframe(e.detail.value)} value={timeframe} >
                        <IonSelectOption value="2000">All Time</IonSelectOption>
                        <IonSelectOption value="0100">Last Year</IonSelectOption>
                        <IonSelectOption value="0006">Last 6 Months</IonSelectOption>
                        <IonSelectOption value="0001">Last Month</IonSelectOption>
                    </IonSelect>
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
                    <SurveyGraph data={dass.processDataForGraph!(surveyHistory)} graphConfig={dass.graphConfig!} />
                    <p className="text-center margin-bottom-0 max-width-600">
                        All three metrics on the graph are on separate scales, so we don't 
                        recommend comparing them to each other. Just compare them to what they 
                        were in the past.
                    </p>
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
