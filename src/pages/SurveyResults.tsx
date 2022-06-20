import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import EndSpacer from "../components/EndSpacer";
import SurveyGraph from "../components/Review/SurveyGraph";
import { auth } from "../firebase";
import { AnyMap, BaselineStates, BASELINE_GRAPH_CONFIG, calculateBaseline, parseSurveyHistory } from "../helpers";
import history from "../history";
import DASS from "../screeners/dass";
import SPF from "../screeners/spf";

const SurveyResults = () => {
    const [user] = useAuthState(auth);
    const [surveyHistory, setSurveyHistory] = useState<AnyMap | undefined>(undefined);
    const [baselineGraph, setBaselineGraph] = useState<AnyMap[] | BaselineStates>(BaselineStates.NOT_STARTED);
    const dass = DASS();
    const spf = SPF();

    useEffect(() => {
        parseSurveyHistory(user, setSurveyHistory);
    }, [user])

    useEffect(() => {
        calculateBaseline(setBaselineGraph);
    }, []);

    return (
        <div className="container">
            <IonIcon class="top-corner x" icon={closeOutline} onClick={() => history.push("/summary")}></IonIcon>
            <div className="center-journal">
                <div className="title">Survey Results</div>
                <br />
                <p className="bold head2">Your baseline</p>
                { typeof baselineGraph === "object" && <SurveyGraph data={baselineGraph} graphConfig={BASELINE_GRAPH_CONFIG} /> }
                { baselineGraph === BaselineStates.NOT_ENOUGH_DATA && <p>We don't have enough data to calculate your baseline. Check back in later!</p>}
                <br />
                <p className="bold head2">Depression, Anxiety, and Stress Levels</p>
                { surveyHistory && <SurveyGraph data={dass.processDataForGraph!(surveyHistory)} graphConfig={dass.graphConfig!} /> }
                <br />
                <p className="bold head2">Resilience</p>
                { surveyHistory && <SurveyGraph data={spf.processDataForGraph!(surveyHistory)} graphConfig={spf.graphConfig!} /> }
                <EndSpacer />
            </div>
        </div>
    );
};

export default SurveyResults;
