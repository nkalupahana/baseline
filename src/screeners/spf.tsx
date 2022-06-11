import { FIND_HELP, GAP_FUND } from "../data";
import Screener, { Priority } from "./screener";

export default function SPF(): Screener {
    return {
        _key: "spfv1",
        _currentQuestion: 0,
        _clinicalName: "SPF-12",
        _questions: [
            "My friends/family keep me up to speed on important events",
            "My friends/family see things the same way",
            "My friends/family are seen as united",
            "I am good at making new friends",
            "I am good at being with other people",
            "I am good at working with others as part of a team",
            "When working on something, I plan things out",
            "When working on something, I set priorities before I start",
            "When working on something, I make a list of things to do in order of importance",
            "I am confident in my ability to achieve goals",
            "I am confident in my ability to think out and plan",
            "I am confident in my ability to succeed"
        ],
        _results: {
            "Social-Interpersonal": 0,
            "Cognitive-Individual": 0
        },
        nextQuestion: function(answer) {
            if (answer !== undefined) {
                this._results[this._currentQuestion < 6 ? "Social-Interpersonal" : "Cognitive-Individual"] += answer;
                ++this._currentQuestion;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            return {
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion],
                answers: [{
                    answer: "Disagree Completely",
                    value: 5
                }, {
                    answer: "Disagree Somewhat",
                    value: 4
                }, {
                    answer: "Neither Agree nor Disagree",
                    value: 3
                }, {
                    answer: "Agree Somewhat",
                    value: 2
                }, {
                    answer: "Agree Completely",
                    value: 1
                }]
            };
        },
        getRecommendation: function() {
            const result = this._results["Social-Interpersonal"] + this._results["Cognitive-Individual"];
            const resilienceBasics = <p>
                Resilence is a measure of how well someone can cope mentally/emotionally with a crisis, and how quickly they 
                can "bounce back" to pre-crisis levels after one happens. It measures a person's ability to 
                move on from a crisis without suffering longer-term consequences. Resilience is a super important 
                thing to keep track of &mdash; if you're low on it, additional stress now could cause much bigger issues 
                than it would normally.
            </p>

            if (result <= 32) {
                return <>
                    { resilienceBasics }
                    <p>Based on your answers, you have high resilence!</p>
                </>;
            } else {
                return <>
                    { resilienceBasics }
                    <p>
                        Based on your answers, you have <b>{ result <= 42 ? "medium" : "low" } resilence.</b> Take a moment to 
                        consider what might be causing your resilence to drop currently. 
                        Is there anything you can do about those current issues?
                    </p>
                    <p>
                        In addition to what you're going through now, resilence is influenced by factors spanning across your entire life. 
                        A lot of these factors aren't obvious, and a professional can help you understand what's going on, 
                        especially if you can see that your resilience level is affecting how you deal with stressors.
                    </p>
                    <p>
                        Therapy, especially Cognitive Behavioral Therapy (CBT) can help increase resilience. <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">Search for treatment providers here!</a> { FIND_HELP }
                    </p>
                    <p>
                        If you need financial assistance for any of this, the baseline Gap Fund can help! { GAP_FUND }
                    </p>
                </>;
            }
        },
        getClinicalInformation: function() {
            return `SPF-12 raw scores: Social-Interpersonal ${this._results["Social-Interpersonal"]}, Cognitive-Individual ${this._results["Cognitive-Individual"]}. Raw scores unscaled, from 1 - 5 for each question (Likert). Cutoffs and scale from doi: 10.1007/s12144-018-0110-6.`;
        },
        getPriority: function() {
            return Priority.NORMAL;
        }
    }
}
