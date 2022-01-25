import { IonSpinner } from "@ionic/react";
import { MouseEvent, useEffect, useState } from "react";
import Screener, { Answer, Done } from "../screeners/screener";

const Surveyer = ({ survey, setSurvey, incrementStage, stage } : 
                { survey: Screener, setSurvey: (arg: Screener) => void, incrementStage: () => void, stage: string }) => {
    
    const [submitting, setSubmitting] = useState(-1);
    const next = (q: Answer) => {
        if (submitting !== -1) return;

        const n = survey.nextQuestion(q.value);
        if ("done" in n && n.done) {
            setSubmitting(q.value);
            setTimeout(() => {
                incrementStage();
            }, 1000);
        }

        setSurvey({
            ...survey,
            ...n,
        });
    }

    return <>
    { survey.question && <div className="container center-summary text-center screener-container">
        <b>{ stage } Survey | { survey.progress }</b>
        <p className="question">{ survey.question }</p>
        { survey.answers?.map(q => <div key={q.answer + q.value} className="finish-button screener-button" onClick={() => {next(q)}}>
            { submitting !== q.value && q.answer }
            { submitting === q.value && <IonSpinner className="loader" name="crescent" /> }
            </div>) }
    </div> }</>;
};

export default Surveyer;