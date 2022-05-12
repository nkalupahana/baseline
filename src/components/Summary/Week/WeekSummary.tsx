import WeekMoodLogList from "./WeekMoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useState } from "react";
import { SummaryProps } from "../../../helpers";

const WeekSummary = ({ setMenuDisabled, logs, bundle } : SummaryProps) => {
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
        <div className="week-summary-grid" style={(logs && logs.length > 0) ? {} : {"height": "100%"}}>
            <div style={{ gridArea: "heading" }} className="center-summary" >
                <div className="title">Here's how your week has been looking.</div>
            </div>
            { logs && logs.length > 0 && <>
                <WeekMoodGraph 
                    getter={bundle.graphEls} 
                    setter={bundle.setGraphEls} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate} 
                    logs={logs}
                />
                <WeekMoodLogList 
                    getter={bundle.listEls} 
                    setter={bundle.setListEls} 
                    setMenuDisabled={setMenuDisabled} 
                    logs={logs} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate} 
                />
            </> }
        </div>
    );
};

export default WeekSummary;
