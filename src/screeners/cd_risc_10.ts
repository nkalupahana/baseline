import { DisplayQuestion, DisplayResult, Screener } from "./screener";

export default class CD_RISC_10 implements Screener {
    static clinicalName = "CD-RISC-10";
    static questions: string[]; // TODO, email sent

    currentQuestion = 0;
    results: number = 0;

    getResults: () => DisplayResult[] = () => {
        return [{
            scoreName: "Overall Score",
            score: this.results
        }];
    }

    nextQuestion: (answer: number | null) => DisplayQuestion | null = answer => {
        if (answer) {
            this.results += answer;
            ++this.currentQuestion;
        }

        if (this.currentQuestion >= CD_RISC_10.questions.length) return null;

        return {
            question: CD_RISC_10.questions[this.currentQuestion],
            answers: [{
                answer: "Not true at all",
                value: 0
            }, {
                answer: "Rarely true",
                value: 1
            }, {
                answer: "Sometimes true",
                value: 2
            }, {
                answer: "Often true",
                value: 3
            }, {
                answer: "True nearly all the time",
                value: 4
            }]
        };
    }

    getRecommendation: () => string = () => {
        return "TODO";
    }

    getClinicalInformation: () => string = () => {
        return `CD-RISC-10 raw score: ${this.results}. Raw scores from 0 - 4 for each question. Cutoffs from TOD.`;
    }
}