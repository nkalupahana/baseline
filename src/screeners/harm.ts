import Screener from "./screener";

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
            return "TODO";
        },
        getClinicalInformation: function() {
            return `Self-Harm ${this._results[0] ? "present" : "not present"}. Screened with single question (doi: 10.1111/j.1467-9450.2007.00567.x). Suicidal ideation ${this._results[1] ? "present" : "not present"}, ${this._results[2] ? "acute" : "non-acute"}. Screened with asQ (questions 1-3, question 5 for acuity).`;
        }
    }
}
