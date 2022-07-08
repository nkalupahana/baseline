import { IonSpinner } from "@ionic/react";
import { DateTime } from "luxon";
import { Ref, useEffect, useState } from "react";
import { Log } from "../../db";
import { getDateFromLog, LOCATOR_OFFSET, parseSettings } from "../../helpers";
import MoodLogCard from "./MoodLogCard";

interface Props {
    logs: Log[],
    container: Ref<HTMLDivElement>,
    inFullscreen: boolean;
    setInFullscreen: (disabled: boolean) => void
    requestedDate: {
        el: string,
        [key: string]: any
    }
    aHeight: string
    filtered: boolean
}

const createLocator = (t: DateTime) => {
    return (<p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${t.month}${t.day}${t.year}`}>
            { t.toFormat("DDDD") }
        </p>);
}

const createEmptyLocator = (t: DateTime) => {
    return (<p id={`i-locator-${t.toISODate()}-bottom`} className="margin-0" key={`${t.month}${t.day}${t.year}-bottom`}></p>);
}

const MoodLogList = ({ logs, container, inFullscreen, setInFullscreen, requestedDate, aHeight, filtered } : Props) => {
    const [els, setEls] = useState<JSX.Element[]>([]);
    const [updating, setUpdating] = useState(window.location.hash === "#update");
    const settings = parseSettings();

    useEffect(() => {
        const listener = () => {
            setUpdating(window.location.hash === "#update");
        };
        window.addEventListener("hashchange", listener);

        return () => {
            window.removeEventListener("hashchange", listener);
        };
    }, []);

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
                const last = today.shift();
                if (last) {
                    if (top) today.unshift(createEmptyLocator(getDateFromLog(top)));
                    today.unshift(last);
                }

                els.push(...today);
                if (top) {
                    t = getDateFromLog(top);
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
    
            today.push(<MoodLogCard setInFullscreen={setInFullscreen} key={log.timestamp} log={log} reduceMotion={settings.reduceMotion} />);
        }
    
        // Add final information
        els.push(...today);
        if (top) {
            t = getDateFromLog(top);
            els.push(createLocator(t));
        }
        els.push(<div key="top-br" style={{"width": "100%", "height": "10px"}}></div>);
    
        // Reverse for display
        els.reverse();

        const now = DateTime.now().startOf("day");
        if ((now.day !== first.day || now.month !== first.month || now.year !== first.year) && !filtered) {
            els.push(createLocator(now));
            els.push(<div className="text-center" key="end1">
                <p>Write your first mood log for the day &mdash; or scroll up to see your old logs.</p>
                <br />
            </div>)
            firstLogs = 0;
        }
    
        els.push(<div className="text-center" key="data-incoming-spinner">{ updating && <IonSpinner className="loader" name="crescent" /> }</div>);
        els.push(<div className="reversed-list-spacer" style={{"height": `calc(${aHeight} - ${(95 * firstLogs)}px)`}} key="spacer"></div>);
        setEls(els);
    }, [logs, setInFullscreen, settings.reduceMotion, aHeight, updating, filtered]);
    
    // Scroll to last log item on load
    useEffect(() => {
        const list = document.getElementById("moodLogList")!;
        const ps = list.querySelectorAll("p");
        // Scroll to last locator 
        if (ps.length < 2) return;
        let i = ps.length - 1;
        while (i > 0) {
            if (ps[i].id.includes("locator") && !ps[i].id.includes("bottom")) {
                list.scrollTop = ps[i].offsetTop - list.offsetTop - LOCATOR_OFFSET;
                return;
            }
            --i;
        }
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
                });
            }
        }
    }, [requestedDate, settings.reduceMotion]);

    return (
        <div ref={container} id="moodLogList" className="mood-log-list" style={inFullscreen ? {} :  {"zIndex": 2}}>
            { els }
        </div>
    );
}

export default MoodLogList;