import { IonSpinner } from "@ionic/react";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { checkKeys, makeRequest, toast } from "../../helpers";
import Screener, { Answer, Done, Modifier } from "../../screeners/screener";

interface Props {
    survey: Screener,
    setSurvey: (survey: Screener) => void,
    incrementStage: () => void,
    stage: string
}

const Surveyer = ({ survey, setSurvey, incrementStage, stage } : Props) => {
    const [submitting, setSubmitting] = useState(-1);
    const [user, loading] = useAuthState(auth);

    const next = async (q: Answer) => {
        if (submitting !== -1) return;

        let n: Modifier | Done | Screener = survey;
        if (!("done" in survey)) {
            n = survey.nextQuestion(q.value);
            setSurvey({
                ...survey,
                ...n,
            });
        }

        if ("done" in n && n.done) {
            // Required because nextQuestion surfaces new results, which
            // won't be updated until the next render.
            const final = {
                ...survey,
                ...n
            }

            if (loading) {
                toast("No internet connectivity -- please try again.");
                return;
            }

            setSubmitting(q.value);
            const res = await makeRequest("surveyEnc", user, {
                key: final._key,
                results: final._results,
                keys: JSON.stringify(checkKeys())
            });

            if (res) {
                incrementStage();
            } else {
                setSubmitting(-1);
            }
        }
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