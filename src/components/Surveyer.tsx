import { useEffect } from "react";
import Screener from "../screeners/screener";

const Surveyer = ({ survey, setSurvey, incrementStage, stage } : 
                { survey: Screener, setSurvey: (arg: Screener) => void, incrementStage: () => void, stage: string }) => {
    useEffect(() => {
        if (survey.done) {
            incrementStage();
        }
    }, [survey.done])

    return <>
    { survey.question && <div className="container center-summary text-center screener-container">
        <b>{ stage } Survey | { survey.progress }</b>
        <p className="question">{ survey.question }</p>
        { survey.answers?.map(q => <div key={q.answer + q.value} className="finish-button screener-button" onClick={() => {setSurvey({
            ...survey,
            ...survey.nextQuestion(q.value)
        })}}>{ q.answer }</div>) }
    </div> }</>;
};

export default Surveyer;