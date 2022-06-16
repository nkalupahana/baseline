import { DateTime } from "luxon";
import { Ref, useEffect, useState } from "react";
import { Log } from "../../db";
import { getDateFromLog, LOCATOR_OFFSET, parseSettings } from "../../helpers";
import MoodLogCard from "./MoodLogCard";

interface Props {
    logs: Log[],
    container: Ref<HTMLDivElement>,
    setMenuDisabled: (disabled: boolean) => void
    reverse: boolean,
    requestedDate: {
        el: string,
        [key: string]: any
    }
}

const createLocator = (t: DateTime) => {
    return (<p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${t.month}${t.day}${t.year}`}>
            { t.toFormat("DDDD") }
        </p>)
}

const MoodLogList = ({ logs, container, setMenuDisabled, reverse, requestedDate } : Props) => {
    const [els, setEls] = useState<JSX.Element[]>([]);
    const settings = parseSettings();

    useEffect(() => {
        let els = [];
        let top: Log | undefined = undefined;
        const zone = DateTime.now().zone.name;
    
        let firstLogs = 0;
        const first = getDateFromLog(logs[0]);
        
        let t;
        let today = [];
        for (let log of logs) {
            // Count number of first day logs, for bottom spacing for calendar
            if (log.day === first.day && log.month === first.month && log.year === first.year) ++firstLogs;
            // If we've moved to the next day, push the day's log and add a locator
            if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
                els.push(...today);
                if (top) {
                    t = getDateFromLog(top ? top : log);
                    els.push(createLocator(t));
                }
                today = [];
                top = log;
            }
    
            // Append a zone to the log if it's not the same as the current zone,
            // and add the log to the list of today's logs
            if (log.zone !== zone && t) {
                const addZone = t.setZone(log.zone).zone.offsetName(t.toMillis(), { format: "short" });
                if (!log.time.includes(addZone)) log.time += " " + addZone;
            }
    
            today.push(<MoodLogCard setMenuDisabled={setMenuDisabled} key={log.timestamp} log={log} reduceMotion={settings.reduceMotion} />);
        }
    
        // Add final information
        els.push(...today);
        if (top) {
            t = getDateFromLog(top);
            els.push(createLocator(t));
        }
    
        // Reverse for display
        els.reverse();

        const now = DateTime.now().startOf("day");
        if (now.day !== first.day || now.month !== first.month || now.year !== first.year) {
            els.push(createLocator(now));
            els.push(<div className="text-center" key="end1">
                <p>Write your first mood log for the day!</p>
                <br />
            </div>)
            firstLogs = 0;
        } else {
            els.push(
                <div className="bold text-center" key="end2">
                    <p>no more logs</p>
                    <br />
                </div>
            );
        }
    
        els.push(<div className="reversed-list-spacer" style={{"height": `calc(100vh - ${(107 * firstLogs + 250)}px)`}} key="spacer"></div>);
        setEls(els);
    }, [logs, setMenuDisabled, settings.reduceMotion]);
    
    // Scroll to last log item on load
    useEffect(() => {
        const list = document.getElementById("moodLogList")!;
        const ps = list.querySelectorAll("p");
        // Scroll to last locator (skips "no more logs" <p> at the end)
        if (ps.length < 3) return;
        list.scrollTop = ps[ps.length - 2].offsetTop - list.offsetTop - LOCATOR_OFFSET;
    }, [els]);

    // Scroll to position if we get a request
    useEffect(() => {
        const node = document.getElementById("moodLogList");
        if (!node) return;
        if (requestedDate && requestedDate.el && requestedDate.el[0] === "g") {
            const id = "i" + requestedDate.el.slice(1);
            const el = node.querySelector("#" + id) as HTMLElement;
            if (el) {
                node.scrollTo({
                    top: el.offsetTop - node.offsetTop - LOCATOR_OFFSET,
                    left: 0,
                    behavior: settings.reduceMotion ? "auto" : "smooth"
                })
            }
        }
    }, [requestedDate, settings.reduceMotion]);

    return (
        <div ref={container} id="moodLogList" className="mood-log-list">
            { els }
        </div>
    );
}

export default MoodLogList;