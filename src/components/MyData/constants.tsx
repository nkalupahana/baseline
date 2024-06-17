import { Log } from "../../db";

export interface DataOption {
    value: string;
    description: string;
    getEntryAttribute: (entry: Log) => any;
}

export const dataOptionsObjArr: DataOption[] = [
    {
        value: "timestamp",
        description: "Timestamp",
        getEntryAttribute: entry => entry.timestamp
    },
    {
        value: "journal",
        description: "Journal Text",
        getEntryAttribute: entry => entry.journal
    },
    {
        value: "mood",
        description: "Mood Score",
        getEntryAttribute: entry => entry.mood
    },
    {
        value: "average",
        description: "Below/At/Above Average",
        getEntryAttribute: entry => entry.average
    },
    {
        value: "zone",
        description: "Time Zone",
        getEntryAttribute: entry => entry.zone
    },
    {
        value: "song",
        description: "Attached Song",
        getEntryAttribute: entry => entry.song
    },
    {
        value: "files",
        description: "File Paths",
        getEntryAttribute: entry => entry.files
    },
]