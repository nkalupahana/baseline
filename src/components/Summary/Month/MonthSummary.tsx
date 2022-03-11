import { useState } from "react";
import { Log } from "../../../db";
import MonthCalendar from "./MonthCalendar";
import "./MonthCalendar.css"
import MonthMoodLogList from "./MonthMoodLogList";

interface Props {
    setMenuDisabled: (disabled: boolean) => void;
    gettingData: boolean;
    logs: Log[];
}

const MonthSummary = ({ gettingData, setMenuDisabled, logs } : Props) => {
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
        <div className="month-summary-grid">
            <div style={{ gridArea: "heading", paddingBottom: "30px" }} className="center-summary">
                <div className="title">Here's how your month has been looking.</div>
            </div>
            { logs && logs.length > 0 && <>
                    <MonthCalendar logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate}/>
                    <MonthMoodLogList logs={logs} setMenuDisabled={setMenuDisabled} requestedDate={requestedDate} setRequestedDate={setRequestedDate} />
                </> }
        </div>
    );
};

export default MonthSummary;