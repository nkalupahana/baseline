import Dexie from "dexie";

export interface Log {
    timestamp: number;
    year: number,
    month: number,
    day: number,
    time: string,
    zone: string,
    mood: number,
    journal?: string,
    ejournal?: string,
    average: string,
    files?: string[],
    efiles?: string
    song?: string;
    audio?: string;
}

interface DB extends Dexie {
    logs: Dexie.Table<Log, number>;
}

const ldb = new Dexie("ldb");
ldb.version(1).stores({
    logs: `&timestamp, year, month, day, time, zone, mood, average`,
});

ldb.on("close", () => console.log("db was forcibly closed"));

export default ldb as DB;