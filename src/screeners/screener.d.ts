interface Modifier {
    _currentQuestion: number;
    _results: any;
    progress: string;
    question: string;
    answers: Answer[];
}

interface Done {
    done: boolean;
    _results: any;
}

interface Answer {
    answer: string;
    value: number;
}

export default interface Screener {
    _currentQuestion: number;
    _clinicalName: string;
    _questions: any[];
    _results: any;
    progress?: string;
    nextQuestion: (answer?: number) => Modifier | Done;
    getRecommendation: () => string;
    getClinicalInformation: () => string;
    question?: string;
    answers?: Answer[];
    done?: boolean;
    [additionalProps: string]: unknown;
}