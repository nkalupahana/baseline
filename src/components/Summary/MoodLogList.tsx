import { DateTime } from "luxon";
import { Ref } from "react";
import { Log } from "../../db";
import MoodLogCard from "./MoodLogCard";

interface Props {
    logs: Log[],
    container: Ref<HTMLDivElement>,
    setMenuDisabled: (disabled: boolean) => void
}

const MoodLogList = ({ logs, container, setMenuDisabled } : Props) => {
    let els = [<br key="begin"/>];
    let top = undefined;
    const now = DateTime.now();
    const zone = now.zone.name;
    let t;
    let today = [];
    for (let log of logs) {
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            els.push(...today.reverse());
            today = [];
            top = log;
            t = DateTime.fromObject({ year: log.year, month: log.month, day: log.day });
            els.push(
                <p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${top.month}${top.day}${top.year}`}>
                    { t.toFormat("DDDD") }
                </p>
            );
        }

        if (log.zone !== zone && t) {
            const addZone = t.setZone(log.zone).zone.offsetName(t.toMillis(), { format: "short" });
            if (!log.time.includes(addZone)) log.time += " " + addZone;
        }

        today.push(<MoodLogCard setMenuDisabled={setMenuDisabled} key={log.timestamp} log={log} />);
    }

    els.push(...today.reverse());
    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    return (
        <>
            <div style={{"gridArea": "logs"}} ref={container} id="moodLogList" className="mood-log-list">
                { els }
            </div>
        </>
    );
}

export default MoodLogList;