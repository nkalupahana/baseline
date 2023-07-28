export interface DataOption {
    value: string;
    description: string;
    getEntryAttribute: (entry: any) => any;
}

export const dataOptionsObjArr: DataOption[] = [
    {
        value: "timestamp",
        description: "Timestamp",
        getEntryAttribute: (entry: any) => entry.timestamp
    },
    {
        value: "journal",
        description: "Journal Text",
        getEntryAttribute: (entry: any) => entry.journal
    },
    {
        value: "mood",
        description: "Mood Score",
        getEntryAttribute: (entry: any) => entry.mood
    },
    {
        value: "average",
        description: "Below/At/Above Average",
        getEntryAttribute: (entry: any) => entry.average
    },
    {
        value: "zone",
        description: "Time Zone",
        getEntryAttribute: (entry: any) => entry.zone
    },
    {
        value: "files",
        description: "File Paths",
        getEntryAttribute: (entry: any) => entry.files
    }
]