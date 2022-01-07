import ldb from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import SummaryHeader from "./SummaryHeader";
import MoodLogList from "./MoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useState } from "react";

const WeekSummary = () => {
    let logs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());
    const [requestedDate, setRequestedDate] = useState({
        el: undefined,
        timeout: undefined,
        list: {
            trustRegion: undefined,
            last: undefined
        },
        graph: {
            trustRegion: undefined,
            last: undefined
        }
    });

    /*
    SCROLL DEBUG LOGGER
    useEffect(() => {
        console.log(requestedDate);
    }, [requestedDate]);
    */

    return (
        <div className="week-summary-grid">
            <SummaryHeader style={{ gridArea: "heading" }}></SummaryHeader>
            { logs && logs.length > 0 && <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs} style={{ gridArea: "graph" }}></WeekMoodGraph> }
            { logs && logs.length > 0 && <MoodLogList logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate}></MoodLogList> }
            { logs && logs.length === 0 && <p className="text-center">Write your first mood log by clicking on the pencil in the bottom right!</p> }
        </div>
    );
};

export default WeekSummary;
