export interface DisplayQuestion {
    question: string;
    answers: Array<{
        answer: string;
        value: number;
    }>
}

export interface DisplayResult {
    scoreName: string;
    score: number;
}

export abstract class Screener {
    static clinicalName: string;
    static questions: any[];

    currentQuestion: number;
    results: any;
    nextQuestion: (answer: number | null) => DisplayQuestion | null;
    getResults: () => DisplayResult[];
    getRecommendation: () => string;
    getClinicalInformation: () => string;
}