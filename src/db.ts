import Dexie from 'dexie';

export interface Log {
    timestamp: number;
    year: number,
    month: number,
    day: number,
    time: string,
    zone: string,
    mood: number,
    journal: string,
    average: string,
    files?: string[],
}

interface ELogData {
    key: number;
    data: string;
}

interface DB extends Dexie {
    logs: Dexie.Table<Log, number>;
    elogs: Dexie.Table<ELogData, number>;
}

const ldb = new Dexie('ldb');
ldb.version(1).stores({
    logs: `&timestamp, year, month, day, time, zone, mood, journal, average`,
    elogs: `&key, data`
});

export default ldb as DB;