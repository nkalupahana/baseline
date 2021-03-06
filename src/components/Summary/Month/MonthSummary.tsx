import { useState } from "react";
import { Log } from "../../../db";
import MonthCalendar from "./MonthCalendar";
import "./MonthCalendar.css"
import MonthMoodLogList from "./MonthMoodLogList";

interface Props {
    inFullscreen: boolean;
    setInFullscreen: (disabled: boolean) => void;
    logs: Log[];
}

const MonthSummary = ({ inFullscreen, setInFullscreen, logs } : Props) => {
    const [requestedDate, setRequestedDate] = useState({
        el: undefined,
        timeout: undefined,
        list: {
            trustRegion: undefined,
            last: undefined
        },
        calendar: undefined
    });

    return (
        <div className="month-summary-grid" style={(logs && logs.length > 0) ? {} : {"height": "100%"}}>
            <div style={{ paddingBottom: "30px" }} className="center-summary grid-heading">
                <div className="title">Here's how your month has been looking.</div>
            </div>
            { logs && logs.length > 0 && <>
                <MonthCalendar logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate}/>
                <MonthMoodLogList logs={logs} inFullscreen={inFullscreen} setInFullscreen={setInFullscreen} requestedDate={requestedDate} setRequestedDate={setRequestedDate} />
            </> }
        </div>
    );
};

export default MonthSummary;