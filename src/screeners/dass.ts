import Screener from "./screener"

export default function DASS(): Screener {
    return {
        _key: "dassv1",
        _currentQuestion: 0,
        _clinicalName: "DASS-21",
        _questions: [
            {
                question: "I found it hard to wind down",
                affects: "s"
            },
            {
                question: "I was aware of dryness of my mouth",
                affects: "a"
            },
            {
                question: "I couldn't seem to experience any positive feeling at all",
                affects: "d"
            },
            {
                question: "I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness in the absence of physical exertion)",
                affects: "a"
            },
            {
                question: "I found it difficult to work up the initiative to do things",
                affects: "d"
            },
            {
                question: "I tended to over-react to situations",
                affects: "s"
            },
            {
                question: "I experienced trembling (e.g., in the hands)",
                affects: "a"
            },
            {
                question: "I felt that I was using a lot of nervous energy",
                affects: "s"
            },
            {
                question: "I was worried about situations in which I might panic and make a fool of myself",
                affects: "a"
            },
            {
                question: "I felt that I had nothing to look forward to",
                affects: "d"
            },
            {
                question: "I found myself getting agitated",
                affects: "s"
            },
            {
                question: "I found it difficult to relax",
                affects: "s"
            },
            {
                question: "I felt down-hearted and blue",
                affects: "d"
            },
            {
                question: "I was intolerant of anything that kept me from getting on with what I was doing",
                affects: "s"
            },
            {
                question: "I felt I was close to panic",
                affects: "a"
            },
            {
                question: "I was unable to become enthusiastic about anything",
                affects: "d"
            },
            {
                question: "I felt I wasn't worth much as a person",
                affects: "d"
            },
            {
                question: "I felt that I was rather touchy",
                affects: "s"
            },
            {
                question: "I was aware of the action of my heart in the absence of physical exertion (e.g., sense of heart rate increase, heart missing a beat)",
                affects: "a"
            },
            {
                question: "I felt scared without any good reason",
                affects: "a"
            },
            {
                question: "I felt that life was meaningless",
                affects: "d"
            }
        ],
        _results: {
            d: 0,
            a: 0,
            s: 0
        },
        nextQuestion: function(answer) {
            if (answer !== undefined) {
                this._results[this._questions[this._currentQuestion].affects] += answer;
                this._currentQuestion += 1;
            }

            if (this._currentQuestion >= this._questions.length) return { _results: this._results, done: true };

            return {
                _currentQuestion: this._currentQuestion,
                _results: this._results,
                progress: `Question ${this._currentQuestion + 1}/${this._questions.length}`,
                question: this._questions[this._currentQuestion].question,
                answers: [{
                    answer: "Never",
                    value: 0
                }, {
                    answer: "Sometimes",
                    value: 1
                }, {
                    answer: "Often",
                    value: 2
                }, {
                    answer: "Almost Always",
                    value: 3
                }]
            };
        },
        getRecommendation: function() {
            return "To be completed";
        },
        getClinicalInformation: function() {
            return `DASS-21 raw scores: d=${this._results.d}, a=${this._results.a}, s=${this._results.s}. Raw scores for each question are not scaled (0 - 3). Standard cutoffs used.`;
        }
    }
}