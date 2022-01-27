import { IonSpinner, useIonToast } from "@ionic/react";
import { getIdToken } from "firebase/auth";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import Screener, { Answer, Done, Modifier } from "../screeners/screener";

const Surveyer = ({ survey, setSurvey, incrementStage, stage } : 
                { survey: Screener, setSurvey: (arg: Screener) => void, incrementStage: () => void, stage: string }) => {
    
    const [submitting, setSubmitting] = useState(-1);
    const [user, loading] = useAuthState(auth);
    const [present] = useIonToast();

    const toast = (message: string) => {
        present({
            message,
            position: "top",
            duration: 3000
        });
    };

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
            let errored = false;
            const token = await getIdToken(user);
            const response = await fetch("https://us-central1-moody-ionic.cloudfunctions.net/survey",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        key: final._key,
                        results: final._results
                    })
                }
            ).catch(e => {
                if (e.message === "Load failed") {
                    toast(`We can't reach our servers. Check your internet connection and try again.`);
                } else {
                    toast(`Something went wrong, please try again! \nError: ${e.message}`);
                }
                errored = true;
                setSubmitting(-1);
                return;
            });

            if (response) {
                if (response.ok) {
                    incrementStage();
                } else {
                    if (!errored) toast(`Something went wrong, please try again! \nError: ${await response.text()}`);
                    setSubmitting(-1);
                }
            } else {
                if (!errored) toast(`Something went wrong, please try again!`);
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