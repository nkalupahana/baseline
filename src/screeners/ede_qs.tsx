import Screener from "./screener";

export default function EDE_QS(): Screener {
    return {
        _key: "edev1",
        _currentQuestion: 0,
        _clinicalName: "EDE-QS",
        _questions: [
            "On how many of the past 7 days have you been deliberately trying to limit the amount of food you eat to influence your weight or shape (whether or not you have succeeded)?",
            "On how many of the past 7 days have you gone for long periods of time (e.g., 8 or more waking hours) without eating anything at all in order to influence your weight or shape?",
            "On how many of the past 7 days has thinking about food, eating or calories made it very difficult to concentrate on things you are interested in (such as working, following a conversation or reading)?",
            "On how many of the past 7 days has as thinking about your weight or shape made it very difficult to concentrate on things you are interested in (such as working, following a conversation or reading)?",
            "On how many of the past 7 days have you had a definite fear that you might gain weight?",
            "On how many of the past 7 days have you had a strong desire to lose weight?",
            "On how many of the past 7 days have you tried to control your weight or shape by making yourself sick (vomit) or taking laxatives?",
            "On how many of the past 7 days have you exercised in a driven or compulsive way as a means of controlling your weight, shape or body fat, or to burn off calories?",
            "On how many of the past 7 days have you had a sense of having lost control over your eating (at the time that you were eating)?",
            "On how many of these days (i.e. days on which you had a sense of having lost control over your eating) did you eat what other people would regard as an unusually large amount of food in one go?",
            "Over the past 7 days, has your weight or shape influenced how you think about (judge) yourself as a person?",
            "Over the past 7 days, how dissatisfied have you been with your weight or shape?"
        ],
        _results: 0,
        nextQuestion: function(answer) {
            if (answer !== undefined) {
                this._results += answer;
                ++this._currentQuestion;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            if (this._questions[this._currentQuestion].includes("On how many of")) {
                this.answers = [
                    {
                        answer: "0 days",
                        value: 0
                    },
                    {
                        answer: "1-2 days",
                        value: 1
                    },
                    {
                        answer: "3-5 days",
                        value: 2
                    },
                    {
                        answer: "6-7 days",
                        value: 3
                    }
                ];
            } else {
                this.answers = [
                    {
                        answer: "Not at all",
                        value: 0
                    },
                    {
                        answer: "Slightly",
                        value: 1
                    },
                    {
                        answer: "Moderately",
                        value: 2
                    },
                    {
                        answer: "Markedly",
                        value: 3
                    }
                ];
            }

            return {
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion],
                answers: this.answers
            };
        },
        getRecommendation: function() {
            if (this._results < 15) {
                return <>Based on your answers to this screener, we do not believe you have an eating disorder.</>;
            } else {
                return <>Your answers on this screener have indicated that you likely have an eating disorder. TODO</>;
            }
        },
        getClinicalInformation: function() {
            return `EDE-QS raw score: ${this._results}. Raw scores for each question are not scaled (0 - 3). Major cutoff = 15 (validated), risk cutoff = 8 (arbitrary).`;
        }
    }
}
