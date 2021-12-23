import Dexie from 'dexie';

interface Item {
    timestamp: number;
    year: number,
    month: number,
    day: number,
    time: string,
    zone: string,
    mood: number,
    journal: string,
    average: string
}

interface DB extends Dexie {
    logs: Dexie.Table<Item, number>;
}

const ldb = new Dexie('ldb');
ldb.version(1).stores({
    logs: `&timestamp, year, month, day, time, zone, mood, journal, average`
});

export default ldb as DB;