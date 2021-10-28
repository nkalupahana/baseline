import Dexie from 'dexie';

const ldb = new Dexie('myDb');
ldb.version(1).stores({
    logs: `timestamp, year, month, day, time, zone, mood, journal, average`
});

export default ldb;