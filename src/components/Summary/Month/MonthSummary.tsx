import { useState } from "react";
import { SummaryProps } from "../../../helpers";
import MonthCalendar from "./MonthCalendar";
import "./MonthCalendar.css"
import MonthMoodLogList from "./MonthMoodLogList";

const MonthSummary = ({ setMenuDisabled, logs, bundle } : SummaryProps) => {
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
            <div style={{ gridArea: "heading", paddingBottom: "30px" }} className="center-summary">
                <div className="title">Here's how your month has been looking.</div>
            </div>
            { logs && logs.length > 0 && <>
                <MonthCalendar 
                    getter={bundle.graphEls} 
                    setter={bundle.setGraphEls} 
                    logs={logs} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate}
                />
                <MonthMoodLogList 
                    getter={bundle.listEls} 
                    setter={bundle.setListEls} 
                    logs={logs} 
                    setMenuDisabled={setMenuDisabled} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate} 
                />
            </> }
        </div>
    );
};

export default MonthSummary;