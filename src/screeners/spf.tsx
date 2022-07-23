import { DateTime } from "luxon";
import { FIND_HELP, GAP_FUND, GAP_FUND_REFER } from "../data";
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
                Resilience is a measure of how well you can cope mentally and emotionally with a crisis, 
                and how quickly you can move on from it without suffering longer-term consequences. It's an important 
                metric to keep track of &mdash; if you're low on it, stress could have a much bigger 
                impact on you than it would normally.
            </p>

            if (result <= 32) {
                return <>
                    { resilienceBasics }
                    <p>Based on your answers, you have high resilence (high is best)!</p>
                </>;
            } else {
                return <>
                    { resilienceBasics }
                    <p>
                        Based on your answers, you have <b>{ result <= 42 ? "medium" : "low" } resilence.</b> Take a moment to 
                        consider what might be causing your resilence to drop currently. 
                        Is there anything you can do to mitigate the effects of those stressors?
                    </p>
                    <p>
                        In addition to what you're going through now, resilence is influenced by factors spanning across your entire life. 
                        A lot of these factors aren't obvious, and a professional can help you understand what's going on. 
                        This is especially important if you can see that your resilience level is affecting how you deal with stressors, 
                        or if your resilience level has been consistently low.
                    </p>
                    <p>
                        Therapy, especially Cognitive Behavioral Therapy (CBT) can help increase 
                        resilience. <a href="https://findtreatment.samhsa.gov/" target="_blank" rel="noreferrer">Search for treatment providers here!</a> { FIND_HELP }
                    </p>
                    <p>
                        If you need financial assistance for any of this, the baseline Gap Fund can help! { GAP_FUND } { GAP_FUND_REFER }
                    </p>
                </>;
            }
        },
        getClinicalInformation: function() {
            return `SPF-12 raw scores: Social-Interpersonal ${this._results["Social-Interpersonal"]}, Cognitive-Individual ${this._results["Cognitive-Individual"]}. Raw scores unscaled, from 1 - 5 for each question (Likert). Score is inverted on graph for understandability. Cutoffs and scale from doi: 10.1007/s12144-018-0110-6.`;
        },
        getPriority: function() {
            return Priority.NORMAL;
        },
        processDataForGraph: function(data) {
            let d = [];
            for (let key in data) {
                if (data[key]["key"] !== this._key) continue;
                // Invert score so higher is better (makes more sense)
                d.push({
                    date: DateTime.fromMillis(Number(key)).toFormat("LLL d"),
                    Score: 60 - (data[key]["results"]["Social-Interpersonal"] + data[key]["results"]["Cognitive-Individual"]),
                });
            }

            return d;
        },
        graphConfig: {
            yAxisLabel: "Score (higher is better)",
            lines: [{
                key: "Score",
                color: "#ff6361"
            }]
        }
    }
}
