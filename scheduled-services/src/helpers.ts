import { DateTime } from "luxon";

export interface AnyMap {
    [key: string]: any;
}

export interface DateTimeMap {
    [key: string]: DateTime;
}

export interface NumberMap {
    [key: string]: number;
}