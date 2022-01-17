import { DisplayQuestion, DisplayResult, Screener } from "./screener";

export default class HARM implements Screener {
    static clinicalName = "Single Question Self-Harm Screening and modified asQ";
    static questions = [
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
    ];

    currentQuestion: number = 0;
    currentSection: number = 0;
    results = [0, 0, 0];

    nextQuestion: (answer: number | null) => DisplayQuestion | null = answer => {
        if (answer) {
            this.results[this.currentSection] = answer
            ++this.currentQuestion;
        }

        if (answer === 1 || this.currentQuestion >= HARM.questions[this.currentSection].length) {
            ++this.currentSection;
            this.currentQuestion = 0;
        }

        if (this.currentSection >= HARM.questions.length || (this.currentSection === 3 && this.results[1] === 0)) {
            return null;
        }

        return {
            question: HARM.questions[this.currentSection][this.currentQuestion],
            answers: [{
                answer: "Yes",
                value: 1
            }, {
                answer: "No",
                value: 0
            }]
        };
    };

    getResults: () => DisplayResult[] = () => {
        return [{
            scoreName: "Self-Harm",
            score: this.results[0] ? 1 : 0
        }, {
            scoreName: "Suicide",
            score: this.results[1] + this.results[2]
        }]
    }

    getRecommendation: () => string = () => {
        return "TODO";
    }

    getClinicalInformation: () => string = () => {
        return `Self-Harm ${this.results[0] ? "present" : "not present"}. Screened with single question (doi: 10.1111/j.1467-9450.2007.00567.x). Suicidal ideation ${this.results[1] ? "present" : "not present"}, ${this.results[2] ? "acute" : "non-acute"}. Screened with asQ (questions 1-3, question 5 for acuity).`;
    }
}