import { useState } from "react";
import WeekInReviewInitial from "../components/WeekInReviewInitial";
import Surveyer from "../components/Surveyer";
import DASS from "../screeners/dass";
import "./WeekInReview.css";
import CAGE_AID from "../screeners/cage_aid";
import SPF from "../screeners/spf";
import EDE_QS from "../screeners/ede_qs";
import HARM from "../screeners/harm";

enum Stage {
    Initial,
    Primary,
    Secondary,
    Review
};

const WeekInReview = () => {
    const [stage, setStage] = useState(Stage.Initial);
    const incrementStage = function() {
        setStage(stage + 1);
    };
    const [primary, setPrimary] = useState(DASS());
    const [secondary, setSecondary] = useState(SPF());

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
        { stage === Stage.Review && <div>Roll tide</div>}
    </>
};

export default WeekInReview;