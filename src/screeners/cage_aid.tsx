import { FIND_HELP, GAP_FUND, GAP_FUND_REFER, TALK_TO_SOMEONE } from "../data";
import Screener, { Priority } from "./screener";

export default function CAGE_AID(): Screener {
    return {
        _key: "cagev1",
        _currentQuestion: 0,
        _clinicalName: "CAGE-AID (with sensitivity and question modifications)",
        // Unmodified questions (for yes/no answers)
        _oldquestions: [
            "Have you ever felt you ought to cut down on your drinking or drug use?",
            "Have people annoyed you by criticizing your drinking or drug use?",
            "Have you felt bad or guilty about your drinking or drug use?",
            "Have you ever had a drink or used drugs first thing in the morning to steady your nerves or to get rid of a hangover (eye-opener)?",
            // Below are unvalidated questions, which are designed to add extra dimensions to this screening.
            "Have you ever been around people you know and been the only one drinking or using drugs?",
            "Have you regularly used unprescribed drugs or alcohol to cope with problems in your life?"
        ],
        // Modified questions (for answers with more selectivity)
        _questions: [
            "I have felt that I ought to cut down on my drinking or drug use",
            "People have annoyed me by criticizing my drinking or drug use.",
            "I have felt bad or guilty about my drinking or drug use.",
            "I have had a drink or used drugs first thing in the morning to steady my nerves or to get rid of a hangover (eye-opener).",
            // Below are unvalidated questions, which are designed to add extra dimensions to this screening.
            "I have been around people I know and been the only one drinking or using drugs.",
            "I have regularly used unprescribed drugs or alcohol to cope with problems in my life."
        ],
        _results: 0,
        nextQuestion: function(answer) {
            let previousState = undefined;
            if (answer !== undefined) {
                previousState = JSON.parse(JSON.stringify(this));
                this._results += answer;
                ++this._currentQuestion;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            return {
                previousState,
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion],
                answers: [{
                    answer: "Not true",
                    value: 0
                }, {
                    answer: "Somewhat true",
                    value: 1
                }, {
                    answer: "Certainly true",
                    value: 2
                }]
            };
        },
        getRecommendation: function() {
            if (this._results < 2) {
                return <p>This should never appear.</p>;
            } else {
                return <>
                    <p>
                        Based on your answers, it looks like you might be struggling with 
                        substance use. Even if you don't think your substance use 
                        is an issue, we highly recommend reaching out to a professional to talk about 
                        your specific circumstances. Substance use can easily spiral into a bigger issue,
                        and can end up impacting many other facets of your life. It's really important to get help sooner
                        rather than later.
                    </p>
                    <p>
                        Alcoholics Anonymous, Narcotics Anonymous, and similar organizations have 
                        historically helped lots of people who are struggling with substance use. 
                        You can look online for a chapter near you. 
                        Additionally, if you're in the US, we recommend going 
                        to <a href="https://www.findtreatment.gov/" target="_blank" rel="noreferrer">findtreatment.gov</a> to 
                        get professional support for specific types of substance use, 
                        or <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">findtreatment.samhsa.gov</a> for 
                        both substance use and general mental health support. { FIND_HELP }
                    </p>
                    <p>
                        Beyond professional support, though, talking to others about what you're going through is 
                        super important. { TALK_TO_SOMEONE }
                    </p>
                    <p>If you need financial assistance for any of this, the baseline Gap Fund can help. { GAP_FUND } { GAP_FUND_REFER }</p>
                </>;
            }
        },
        getClinicalInformation: function() {
            return `CAGE-AID, with increased sensitivity (instead of no/yes, not true/somewhat true/certainly true; doi: 10.1080/10826080802484264) and two extra questions regarding solo use around others and using to cope (not experimentally validated). Raw score: ${this._results}. Raw scores from 0 - 2 for each question. Cutoff = 2 (same paper).`;
        },
        getPriority: function() {
            return this._results < 2 ? Priority.DO_NOT_SHOW : Priority.HIGH;
        }
    }
}
