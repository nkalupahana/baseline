import MoodLogCard from "./MoodLogCard";
import ldb from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import SummaryHeader from "./SummaryHeader";

const WeekSummary = () => {
    let logs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());

    function createLogList(l) {
        let els = [];
        let top = false;
        const now = DateTime.now();
        const zone = now.zone.offsetName(now.toMillis(), {format: "short"})
        for (let log of l) {
            if (!top || top.day != log.day || top.month != log.month || top.year != log.year) {
                top = log;
                els.push(<p className="bold text-center" key={`${top.month}${top.day}${top.year}`}>{top.month}/{top.day}/{top.year}</p>);
            }

            if (log.zone != zone && !log.time.includes(log.zone)) {
                log.time += " " + log.zone;
            }

            els.push(<MoodLogCard key={log.timestamp} log={log} />)
        }

        els.push(<div className="bold text-center" key="end"><p>no more logs</p><br /></div>)
        return els;
    }

    return (
        <div className="week-summary-grid">
            <SummaryHeader style={{"gridArea": "heading"}}></SummaryHeader>
            <div style={{"gridArea": "graph"}}>Graph goes here!</div>
            { logs && <div className="mood-log-list">
                {createLogList(logs)}
            </div> }
        </div>
    );
};

export default WeekSummary;