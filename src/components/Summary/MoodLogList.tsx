import { DateTime } from "luxon";
import { Ref, useEffect } from "react";
import { Log } from "../../db";
import { getDateFromLog } from "../../helpers";
import MoodLogCard from "./MoodLogCard";

interface Props {
    logs: Log[],
    container: Ref<HTMLDivElement>,
    setMenuDisabled: (disabled: boolean) => void
    reverse: boolean
}

const createLocator = (t: DateTime) => {
    return (<p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${t.month}${t.day}${t.year}`}>
            { t.toFormat("DDDD") }
        </p>)
}

const MoodLogList = ({ logs, container, setMenuDisabled, reverse } : Props) => {
    let els = [];
    let top: Log | undefined = undefined;
    const now = DateTime.now();
    const zone = now.zone.name;
    let t;
    let today = [];
    for (let log of logs) {
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            if (!reverse) today.reverse();
            els.push(...today);
            if ((top && reverse) || !reverse) {
                t = getDateFromLog((reverse && top) ? top : log);
                els.push(createLocator(t));
            }
            today = [];
            top = log;
        }

        if (log.zone !== zone && t) {
            const addZone = t.setZone(log.zone).zone.offsetName(t.toMillis(), { format: "short" });
            if (!log.time.includes(addZone)) log.time += " " + addZone;
        }

        today.push(<MoodLogCard setMenuDisabled={setMenuDisabled} key={log.timestamp} log={log} />);
    }

    if (!reverse) today.reverse();
    els.push(...today);
    if (reverse && top) {
        t = getDateFromLog(top);
        els.push(createLocator(t));
    }

    if (reverse) {
        els.reverse();
    }

    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    if (reverse) {
        els.push(<div className="reversed-list-spacer" key="spacer"></div>);
    } else {
        els.unshift(<br key="begin" />)
    }

    useEffect(() => {
        const list = document.getElementById("moodLogList")!;
        const ps = list.querySelectorAll("p");
        console.log(ps[ps.length - 2]);
        list.scrollTop = ps[ps.length - 2].offsetTop - list.offsetTop - 30;
    }, []);

    return (
        <div ref={container} id="moodLogList" className="mood-log-list">
            { els }
        </div>
    );
}

export default MoodLogList;