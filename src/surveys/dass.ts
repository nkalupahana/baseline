import { DisplayQuestion, DisplayResult, Screener } from "./screener";

interface Question {
    question: string;
    affects: string;
}

interface Results {
    [key: string]: number;
}

export default class DASS implements Screener {
    static clinicalName = "DASS-21";
    static questions: Question[] = [
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
    ]

    results: Results = {
        d: 0,
        a: 0,
        s: 0
    }

    currentQuestion = 0;

    nextQuestion: (answer: number | null) => DisplayQuestion | null = answer => {
        if (answer) {
            this.results[DASS.questions[this.currentQuestion].affects] += answer;
            ++this.currentQuestion;
        }

        if (this.currentQuestion >= DASS.questions.length) {
            return null;
        }

        return {
            question: DASS.questions[this.currentQuestion].question,
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
    }

    getResults: () => DisplayResult[] = () => {
        return [
            {
                scoreName: "Depression",
                score: this.results.d
            },
            {
                scoreName: "Anxiety",
                score: this.results.a
            },
            {
                scoreName: "Stress",
                score: this.results.s
            }
        ];
    }

    getRecommendation: () => string = () => {
        return "To be completed";
    }

    getClinicalInformation: () => string = () => {
        return `DASS-21 raw scores: d=${this.results.d}, a=${this.results.a}, s=${this.results.s}. Raw scores for each question are not scaled (0 - 3). Standard cutoffs used.`;
    }
}