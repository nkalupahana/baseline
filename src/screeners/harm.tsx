import { FIND_HELP, GAP_FUND, GAP_FUND_LINK, HOTLINES, TALK_TO_SOMEONE } from "../data";
import Screener, { Priority } from "./screener";

export default function HARM(): Screener {
    return {
        _key: "harmv1",
        _currentQuestion: 0,
        _currentSection: 0,
        _clinicalName: "Single Question Self-Harm Screening and modified asQ",
        _questions: [
            [
                "In the past few weeks, did you ever intentionally cut your wrist, arms, or other areas of your body?"
            ],
            [
                "In the past few weeks, have you wished you were dead?",
                "In the past few weeks, have you felt that you or your family would be better off if you were dead?",
                "In the past week, have you been having thoughts about killing yourself?"
            ],
            [
                "Are you having thoughts of killing yourself right now?"
            ]
        ],
        _results: [0, 0, 0],
        nextQuestion: function(answer) {
            if (answer !== undefined) {
                this._results[this._currentQuestion] = answer;
                ++this._currentQuestion;
            }

            if (answer === 1 || this._currentQuestion >= this._questions[(this._currentSection as number)].length) {
                ++(this._currentSection as number);
                this._currentQuestion = 0;
            }

            if ((this._currentSection as number) >= this._questions.length || (this._currentSection === 2 && this._results[1] === 0)) {
                return { _results: this._results, done: true };
            }

            let pastQuestions = 0;
            for (let i = 0; i < (this._currentSection as number); ++i) {
                pastQuestions += this._questions[i].length;
            }

            return {
                _currentQuestion: this._currentQuestion,
                _currentSection: this._currentSection,
                _results: this._results,
                progress: `Question ${this._currentQuestion + pastQuestions + 1}/${this._questions.flat().length}`,
                question: this._questions[this._currentSection as number][this._currentQuestion],
                answers: [{
                    answer: "No",
                    value: 0
                }, {
                    answer: "Yes",
                    value: 1
                }]
            };
        },
        getRecommendation: function() {
            const GAP_FUND_ALL = <p>
                We understand that getting this type of help might also be cost-prohibitive. 
                The baseline Gap Fund is here to help. { GAP_FUND }
            </p>
            if (this._results[0] === 1 && this._results[1] === 0 && this._results[2] === 0) {
                return <>
                    <p>
                        Hi there. It sounds like you've been struggling with self-harm. No matter 
                        what you've been struggling with, we're here for you.
                    </p>
                    <p>
                        First of all, try to talk to someone about what you're going through. { TALK_TO_SOMEONE }
                    </p>
                    <p>
                        More importantly, though, self-harm is often just the first step in a serious mental health
                        crisis. It is <b>crucial</b> that you seek professional help. 
                        <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">Search for treatment providers here!</a> { FIND_HELP }
                    </p>
                    { GAP_FUND_ALL }
                </>;
            }

            if (this._results[1] === 1 && this._results[2] === 0) {
                return <>
                    <p>
                        Hi there. It sounds like you've been struggling with a lot lately, including 
                        suicidal ideation. No matter what you've been struggling with, we're here for you.
                    </p>
                    <p>
                        First of all, try to talk to someone about what you're going through. { TALK_TO_SOMEONE }
                    </p>
                    <p>
                        More importantly, though, it's <b>crucial</b> that you seek professional help. Here are some people 
                        you can talk to right now:
                    </p>
                    { HOTLINES }
                    <p>
                        As for the long term, we urge you to seek professional help from a 
                        therapist. <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">Search for treatment providers here!</a> { FIND_HELP }
                    </p>
                    { GAP_FUND_ALL }
                </>
            }

            if (this._results[2] === 1) {
                return <>
                    <p>
                        Hi there. Thank you for telling us what's going on. We can't imagine how much you're 
                        dealing with right now, and we're here for you.
                        We urge you to drop whatever you're doing and get help right now. It's so, so important 
                        that you talk to someone about how you're feeling. If there's nobody in your life you 
                        feel safe doing that with, try these 24/7 hotlines:
                    </p>
                    { HOTLINES }
                    <p>
                        You can also call your country's emergency number for immediate support, 
                        if you're comfortable with that.
                    </p>
                    <p>
                        Please, get help as soon as you can. We're here for you. If you need financial 
                        support for anything, the baseline Gap Fund can help. { GAP_FUND_LINK }
                    </p>
                </>
            }

            return <p>This should never appear.</p>
        },
        getClinicalInformation: function() {
            return `Self-Harm ${this._results[0] ? "present" : "not present"}. Screened with single question (doi: 10.1111/j.1467-9450.2007.00567.x). Suicidal ideation ${this._results[1] ? "present" : "not present"}, ${this._results[2] ? "acute" : "non-acute"}. Screened with asQ (questions 1-3, question 5 for acuity).`;
        },
        getPriority: function() {
            if (this._results[0] === 1 && this._results[1] === 0 && this._results[2] === 0) {
                return Priority.HIGH;
            }

            if (this._results[1] === 1 || this._results[2] === 1) {
                return Priority.CRITICAL;
            }

            return Priority.DO_NOT_SHOW;
        }
    }
}
