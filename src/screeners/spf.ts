import Screener from "./screener";

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

            if (result <= 32) {
                return "High Resilience. TODO";
            } else if (result <= 42) {
                return "Medium Resilience. TODO";
            } else {
                return "Low Resilience. TODO";
            }
        },
        getClinicalInformation: function() {
            return `SPF-12 raw scores: Social-Interpersonal ${this._results["Social-Interpersonal"]}, Cognitive-Individual ${this._results["Cognitive-Individual"]}. Raw scores unscaled, from 1 - 5 for each question (Likert). Cutoffs and scale from doi: 10.1007/s12144-018-0110-6.`;
        }
    }
}
