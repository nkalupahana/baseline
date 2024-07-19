import { IonSpinner } from "@ionic/react";
import { DateTime } from "luxon";
import { Ref, useEffect, useMemo, useState } from "react";
import { Log } from "../../db";
import { COLORS, COLORS_CB, getDateFromLog, parseSettings } from "../../helpers";
import MoodLogCard from "./MoodLogCard";
import { YESTERDAY_BACKLOG } from "../../data";
import StreakBadge from "./StreakBadge";

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
    filtered: boolean,
    LOCATOR_OFFSET: number
}

const createLocator = (t: DateTime) => {
    return (<p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${t.toISODate()}`}>
            { t.toFormat("DDDD") }
        </p>);
}

const createEmptyLocator = (t: DateTime) => {
    return (<p id={`i-locator-${t.toISODate()}-bottom`} className="margin-0" key={`${t.toISODate()}-bottom`}></p>);
}

const MoodLogList = ({ logs, container, inFullscreen, setInFullscreen, requestedDate, aHeight, filtered, LOCATOR_OFFSET } : Props) => {
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

    const els = useMemo(() => {
        let els = [];
        let top: Log | undefined = undefined;
        const zone = DateTime.now().zone.name;
        const nowTimestamp = DateTime.now().toMillis();
    
        let firstLogs = 0;
        if (logs.length === 0) {
            return [<div key="top-spacer-no-results" style={{"width": "100%", "height": "120px"}}></div>, <p key="no-results" className="text-center">No Results</p>];
        }
        
        let prevTopDate;
        let today = [];
        const colors = parseSettings()["colorblind"] ? COLORS_CB : COLORS;

        const first = getDateFromLog(logs[0]);

        // Count number of first day logs, for bottom spacing for calendar
        for (let log of logs) {
            if (log.day === first.day && log.month === first.month && log.year === first.year) {
                ++firstLogs;
            } else {
                break;
            }
        }

        const todayDT = DateTime.now().startOf("day");
        const yesterdayDT = todayDT.minus({ days: 1 });
        let checkInsertYesterday = false;
        let streakIndicatorAdded = false;

        /*
         * If the first log is not today, add a message
         * to write the first log for the day.
         * If the first log is not yesterday, add a message
         * to add a backlog for yesterday.
         * If the first log is from today, set a flag
         * to check if we need to add a backlog for yesterday
         * in the primary log loop.
         */
        if (!filtered && first.toISODate() !== todayDT.toISODate()) {
            els.push(<StreakBadge logs={logs} key="streakbadge" />)
            els.push(<div className="text-center" key="end1">
                <p>Write your first mood log for the day &mdash; or scroll up to see your old logs.</p>
                <div className="br"></div>
            </div>);
            els.push(createLocator(todayDT));
            firstLogs = 0;

            if (first.toISODate() !== yesterdayDT.toISODate()) {
                els.push(YESTERDAY_BACKLOG());
                els.push(createLocator(yesterdayDT));
            }
        } else {
            checkInsertYesterday = true;
        }

        for (let log of logs) {
            // If we've moved to the next day, push the day's log and add a locator
            if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
                const last = today.shift();
                if (last) {
                    if (top) today.unshift(createEmptyLocator(getDateFromLog(top)));
                    today.unshift(last);
                }

                els.push(...today);
                if (top) {
                    prevTopDate = getDateFromLog(top);
                    if (!streakIndicatorAdded) {
                        els.push(<StreakBadge logs={logs} key="streakbadge" />);
                        streakIndicatorAdded = true;
                    }

                    els.push(createLocator(prevTopDate));

                    // If we've passed the first day (today), check to see if
                    // we need to add a backlog message for yesterday
                    if (checkInsertYesterday && !filtered && getDateFromLog(log).toISODate() !== yesterdayDT.toISODate()) {
                        els.push(YESTERDAY_BACKLOG());
                        els.push(createLocator(yesterdayDT));
                    }
                    checkInsertYesterday = false;
                }

                today = [];
                top = log;
            }
    
            // Append a zone to the log if it's not the same as the current zone,
            // and add the log to the list of today's logs
            // Done on previous date to avoid conflicts (e.g. time could be both CST and CDT) 
            // and efficiency (may not be 100% correct around DST, but it's close enough)
            if (log.zone !== zone) {
                if (!prevTopDate) prevTopDate = getDateFromLog(top);
                const addZone = prevTopDate.setZone(log.zone).zone.offsetName(prevTopDate.toMillis(), { format: "short" });
                if (!log.time.endsWith(addZone) && log.addFlag !== "summary") log.time += " " + addZone;
            }
    
            today.push(<MoodLogCard colors={colors} setInFullscreen={setInFullscreen} key={log.timestamp} log={log} reduceMotion={settings.reduceMotion} LOCATOR_OFFSET={LOCATOR_OFFSET} now={nowTimestamp} />);
        }
    
        // Add final information
        els.push(...today);
        if (top) {
            prevTopDate = getDateFromLog(top);
            els.push(createLocator(prevTopDate));
        }
        els.push(<div key={filtered ? "top-br-filtered" : "top-br"} style={{"width": "100%", "height": `${LOCATOR_OFFSET}px`}}></div>);

        // Reverse for display
        els.reverse();
    
        els.push(<div className="text-center" key="data-incoming-spinner">{ updating && <IonSpinner className="loader" name="crescent" /> }</div>);
        els.push(<div className="reversed-list-spacer" style={{"height": `calc(${aHeight} - ${(95 * firstLogs)}px)`}} key="spacer"></div>);
        return els;
    }, [logs, setInFullscreen, settings.reduceMotion, aHeight, updating, filtered, LOCATOR_OFFSET]);
    
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
    }, [els, LOCATOR_OFFSET]);

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
    }, [requestedDate, settings.reduceMotion, LOCATOR_OFFSET]);

    return (
        <div ref={container} id="moodLogList" className="mood-log-list" style={inFullscreen ? {} :  {"zIndex": 2}}>
            { els }
        </div>
    );
}

export default MoodLogList;