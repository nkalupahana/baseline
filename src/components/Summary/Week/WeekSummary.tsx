import { Log } from "../../../db";
import SummaryHeader from "../SummaryHeader";
import WeekMoodLogList from "./WeekMoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useState } from "react";
import Preloader from "../../../pages/Preloader";

interface Props {
    setMenuDisabled: (disabled: boolean) => void;
    gettingData: boolean;
    logs: Log[];
}

const WeekSummary = ({ gettingData, setMenuDisabled, logs } : Props) => {
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
            <SummaryHeader></SummaryHeader>
            { logs && logs.length > 0 && <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs}></WeekMoodGraph> }
            { logs && logs.length > 0 && <WeekMoodLogList setMenuDisabled={setMenuDisabled} logs={logs} requestedDate={requestedDate} setRequestedDate={setRequestedDate} /> }
            { logs && logs.length === 0 && !gettingData && <p className="text-center">Write your first mood log by clicking on the pencil in the bottom right!</p> }
            { (!logs || (logs.length === 0 && gettingData)) && <Preloader /> }
        </div>
    );
};

export default WeekSummary;
