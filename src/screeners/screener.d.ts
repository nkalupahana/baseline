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

export enum Priority {
    DO_NOT_SHOW,
    LOW,
    NORMAL,
    HIGH,
    CRITICAL
}

export default interface Screener {
    _key: string;
    _currentQuestion: number;
    _clinicalName: string;
    _questions: any[];
    _results: any;
    progress?: string;
    nextQuestion: (answer?: number) => Modifier | Done;
    getRecommendation: () => JSX.Element;
    getClinicalInformation: () => string;
    getPriority: () => Priority;
    question?: string;
    answers?: Answer[];
    done?: boolean;
    [additionalProps: string]: unknown;
}