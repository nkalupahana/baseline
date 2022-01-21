import { DisplayQuestion, DisplayResult, Screener } from "./screener"

interface Results {
    [key: string]: number;
}

export default class SPF implements Screener {
    static clinicalName = "SPF-12";
    static questions: string[] = [
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
    ];

    currentQuestion = 0;
    results: Results = {
        "Social-Interpersonal": 0,
        "Cognitive-Individual": 0
    };

    nextQuestion: (answer: number | null) => DisplayQuestion | null = answer => {
        if (answer) {
            this.results[this.currentQuestion < 6 ? "Social-Interpersonal" : "Cognitive-Individual"] += answer;
            ++this.currentQuestion;
        }
        
        if (this.currentQuestion >= SPF.questions.length) return null;

        return {
            question: SPF.questions[this.currentQuestion],
            answers: [
                {
                    answer: "Agree Completely",
                    value: 1
                }, {
                    answer: "Agree Somewhat",
                    value: 2
                }, {
                    answer: "Neither Agree nor Disagree",
                    value: 3,
                }, {
                    answer: "Disagree Somewhat",
                    value: 4
                }, {
                    answer: "Disagree Completely",
                    value: 5
                }
            ]
        };
    }

    getResults: () => DisplayResult[] = () => {
        return [{
            scoreName: "Overall Score",
            score: this.results["Social-Interpersonal"] + this.results["Cognitive-Individual"]
        }];
    }

    getRecommendation: () => string = () => {
        const result = this.results["Social-Interpersonal"] + this.results["Cognitive-Individual"];

        if (result <= 32) {
            return "Low Resilience. TODO";
        } else if (result <= 42) {
            return "Moderate Resilience. TODO";
        } else {
            return "High Resilience. TODO";
        }
    }

    getClinicalInformation: () => string = () => {
        return `SPF-12 raw scores: Social-Interpersonal ${this.results["Social-Interpersonal"]}, Cognitive-Individual ${this.results["Cognitive-Individual"]}. Raw scores unscaled, from 1 - 5 for each question (Likbert). Cutoffs and scale from doi: 10.1007/s12144-018-0110-6.`;
    }
}