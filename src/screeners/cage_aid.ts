import { DisplayQuestion, DisplayResult, Screener } from "./screener"

export default class CAGE_AID implements Screener {
    static clinicalName = "CAGE-AID (with sensitivity and question modifications)";
    static _questions: string[] = [
        "Have you ever felt you ought to cut down on your drinking or drug use?",
        "Have people annoyed you by criticizing your drinking or drug use?",
        "Have you felt bad or guilty about your drinking or drug use?",
        "Have you ever had a drink or used drugs first thing in the morning to steady your nerves or to get rid of a hangover (eye-opener)?",
        // Below are unvalidated questions, which are designed to add extra dimensions to this screening.
        "Have you ever been around people you know and been the only one drinking or using drugs?",
        "Have you regularly used unprescribed drugs or alcohol to cope with problems in your life?"
    ];

    static questions: string[] = [
        "I have felt that I ought to cut down on my drinking or drug use",
        "People have annoyed me by criticizing my drinking or drug use.",
        "I have felt bad or guilty about my drinking or drug use.",
        "I have had a drink or used drugs first thing in the morning to steady my nerves or to get rid of a hangover (eye-opener).",
        "I have been around people I know and been the only one drinking or using drugs.",
        "I have regularly used unprescribed drugs or alcohol to cope with problems in my life."
    ];

    currentQuestion = 0;
    results = 0;

    nextQuestion: (answer: number | null) => DisplayQuestion | null = answer => {
        if (answer) {
            this.results += answer;
            ++this.currentQuestion;
        }

        if (this.currentQuestion >= CAGE_AID.questions.length) return null;

        return {
            question: CAGE_AID.questions[this.currentQuestion],
            // TODO: answers don't make much sense in the context of the questions
            // email to researcher pending
            answers: [
                {
                    answer: "Not true",
                    value: 0
                }, {
                    answer: "Somewhat true",
                    value: 1
                }, {
                    answer: "Certainly true",
                    value: 2
                }
            ]
        };
    }

    getResults: () => DisplayResult[] = () => {
        return [{
            scoreName: "Overall Score",
            score: this.results
        }];
    }

    getRecommendation: () => string = () => {
        if (this.results < 2) {
            return "Based on your answers to this screener, we do not believe you have a substance use disorder.";
        } else {
            return "Your answers on this screener have indicated that you have issues with substance abuse, and likely have a substance use disorder. TODO";
        }
    }

    getClinicalInformation: () => string = () => {
        return `CAGE-AID, with increased sensitivity (instead of no/yes, not true/somewhat true/certainly true; doi: 10.1080/10826080802484264) and two extra questions regarding solo use around others and using to cope (not experimentally validated). Raw score: ${this.results}. Raw scores from 0 - 2 for each question. Cutoff = 2 (same paper).`;
    }
}