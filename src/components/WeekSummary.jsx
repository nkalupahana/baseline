import MoodLogCard from "./MoodLogCard";
import ldb from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";

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
                els.push(<p key={Math.random()}>{top.month}/{top.day}/{top.year}</p>);
            }

            if (log.zone != zone && !log.time.includes(log.zone)) {
                log.time += " " + log.zone;
            }

            els.push(<MoodLogCard key={log.timestamp} log={log} />)
        }

        els.push(<div key="end"><p>No more logs.</p><br /></div>)
        return els;
    }

    return (
        <div>
            { logs && <div className="center-summary mood-log-list">
                {createLogList(logs)}
            </div> }
        </div>
    );
};

export default WeekSummary;