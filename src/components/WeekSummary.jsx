import ldb from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import SummaryHeader from "./SummaryHeader";
import MoodLogList from "./MoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useEffect, useState } from "react";

const WeekSummary = () => {
    let logs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());
    const [requestedDate, setRequestedDate] = useState({
        el: undefined,
        list: {
            trustRegion: undefined,
            last: undefined
        },
        graph: {
            trustRegion: undefined,
            last: undefined
        }
    });

    useEffect(() => {
        console.log(requestedDate);
    }, [requestedDate]);

    return (
        <div className="week-summary-grid">
            <SummaryHeader style={{ gridArea: "heading" }}></SummaryHeader>
            <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs} style={{ gridArea: "graph" }}></WeekMoodGraph>
            { logs && <MoodLogList logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate}></MoodLogList> }
        </div>
    );
};

export default WeekSummary;
