import MoodLogCard from "./MoodLogCard";
import ldb from "../db";
import { useLiveQuery } from "dexie-react-hooks";

const WeekSummary = () => {
    let logs = useLiveQuery(() => ldb.logs.orderBy("timestamp").reverse().toArray());

    function createLogList(l) {
        let els = [];
        let top = false;
        for (let log of l) {
            if (!top || top.day != log.day || top.month != log.month || top.year != log.year) {
                top = log;
                console.log(top);
                els.push(<p key={Math.random()}>{top.month}/{top.day}/{top.year}</p>);
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