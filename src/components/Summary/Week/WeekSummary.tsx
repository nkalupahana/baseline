import { Log } from "../../../db";
import WeekMoodLogList from "./WeekMoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useState } from "react";

interface Props {
    setMenuDisabled: (disabled: boolean) => void;
    logs: Log[];
}

const WeekSummary = ({ setMenuDisabled, logs } : Props) => {
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
                <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs}></WeekMoodGraph>
                <WeekMoodLogList setMenuDisabled={setMenuDisabled} logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate} />
            </> }
        </div>
    );
};

export default WeekSummary;
