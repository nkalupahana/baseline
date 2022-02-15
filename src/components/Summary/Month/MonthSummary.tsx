import { useCallback } from "react";
import { Log } from "../../../db";
import useCallbackRef from "../../../useCallbackRef";
import MoodLogList from "../MoodLogList";
import SummaryHeader from "../SummaryHeader";
import MonthCalendar from "./MonthCalendar";
import "./MonthCalendar.css"

interface Props {
    setMenuDisabled: (disabled: boolean) => void;
    gettingData: boolean;
    logs: Log[];
}

const MonthSummary = ({ gettingData, setMenuDisabled, logs } : Props) => {
    const container = useCallbackRef(useCallback((node: any) => {
        console.log(node);
        return () => {
            console.log(node);
        }
    }, []));

    return (
        <div className="month-summary-grid">
            <SummaryHeader></SummaryHeader>
            { logs && logs.length > 0 && <>
                    <MonthCalendar logs={logs} />
                    <MoodLogList container={container} logs={logs} setMenuDisabled={setMenuDisabled} />
                </> }
        </div>
    );
};

export default MonthSummary;