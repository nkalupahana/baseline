import { AnyMap } from "../helpers";

export interface Modifier {
    _currentQuestion: number;
    _results: any;
    progress: string;
    question: string;
    answers: Answer[];
}

export interface Done {
    done: boolean;
    _results: any;
}

export interface Answer {
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

interface Line {
    key: string;
    color: string;
}

export interface GraphConfig {
    yAxisLabel: string;
    yDomain?: [(min: number) => number, (max: number) => number];
    yAxisWidth?: number;
    lines: Line[]
}

export default interface Screener {
    _key: string;
    _currentQuestion: number;
    _clinicalName: string;
    _questions: any[];
    _results: any;
    progress?: string;
    graphConfig?: GraphConfig;
    processDataForGraph?: (data?: AnyMap) => AnyMap[];
    nextQuestion: (answer?: number) => Modifier | Done;
    getRecommendation: () => JSX.Element;
    getClinicalInformation: () => string;
    getPriority: () => Priority;
    question?: string;
    answers?: Answer[];
    done?: boolean;
    previousState?: Screener;
    [additionalProps: string]: unknown;
}