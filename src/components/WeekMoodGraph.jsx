import "./WeekMoodGraph.css";
import { DateTime } from "luxon";
import { useEffect, useCallback } from "react";
import useCallbackRef from "../useCallbackRef";
import { getTime } from "../helpers";

function getDate(log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

const SECONDS_IN_DAY = 86400;
// https://materializecss.com/color
const COLORS = {
    "-5": "black",
    "-4": "#d50000", // red accent-4
    "-3": "#fb8c00", // orange darken-1
    "-2": "#ffca28", // amber lighten-1
    "-1": "#ffeb3b", // yellow
    "0": "#03a9f4",  // light-blue
    "1": "#4fc3f7",  // light-blue lighten-2
    "2": "#cddc39",  // lime
    "3": "#8bc34a",  // light-green
    "4": "#43a047",  // green darken-1
    "5": "black"
}

function createGraphCard(date, data=[]) {
    let points = [];
    for (let point of data) {
        let [hour, rest] = point.time.split(":");
        hour = Number(hour);
        if (hour === 12) hour = 0;
        let [minute, meridiem] = rest.split(" ");
        minute = Number(minute);
        const time = DateTime.fromObject({hour: (meridiem === "AM" ? hour : hour + 12), minute}, {zone: point.zone});
        const seconds = (time.toSeconds() - time.startOf("day").toSeconds());
        const style = {
            left: `${seconds / SECONDS_IN_DAY * 100}%`,
            top: `${(10 - (point.mood + 5)) * 6.5 + 25}%`,
            backgroundColor: COLORS[point.mood]
        }
        points.push(<div id={point.time} className="marker" key={point.timestamp} style={style}></div>);
    }

    const locator = "g-locator-" + date.toISODate();
    return (<div key={locator} id={locator} className="graph-card">
                <div className="graph-card-date">{date.toFormat("ccc")}</div>
                <div className="graph-card-date">{date.toFormat("L/d")}</div>
                <div className="graph-card-line"></div>
                {points}
            </div>);
}

const ARROW_OFFSET = 20;
const WeekMoodGraph = ({ requestedDate, setRequestedDate, logs }) => {
    const container = useCallbackRef(useCallback(node => {
        if (!node) return;
        const listener = _ => {
            if (requestedDate.el && requestedDate.el[0] === "i" && requestedDate.timeout > getTime()) {
                // Computer-generated scroll event -- so we're checking to see
                // if we've made it to the requested element
                const id = "g" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const elBox = el.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (node.offsetLeft + node.offsetWidth) + 8
                    // If we have, remove it
                    // and set it to the trust region
                    if (bound < 20 && bound > -20) {
                        setRequestedDate({
                            el: undefined,
                            timeout: requestedDate.timeout,
                            list: requestedDate.list,
                            graph: {
                                trustRegion: el,
                                last: id
                            }
                        });
                    }
                }
            } else {
                // It's a user scroll (probably)
                if (requestedDate.trustRegionGraph) {
                    // If we're in the trust region, it might not be a user scroll,
                    // so let's check for that
                    const elBox = requestedDate.trustRegionGraph.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (node.offsetLeft + node.offsetWidth) + 8
                    if (bound < 20 && bound > -20) {
                        return;
                    } else {
                        // And if we've left the trust region, remove it
                        setRequestedDate({
                            el: requestedDate.el,
                            timeout: requestedDate.timeout,
                            list: requestedDate.list,
                            graph: {
                                trustRegion: undefined,
                                last: requestedDate.graph.last
                            }
                        })
                    }
                }

                // Otherwise, let's get the new position the user
                // has scrolled to, and if it's a new place sync the list to it
                for (let child of node.children) {
                    if (child.getBoundingClientRect().x < node.getBoundingClientRect().right - ARROW_OFFSET) {
                        const locator = child.id;
                        if (locator !== requestedDate.el && locator !== requestedDate.graph.last) {
                            setRequestedDate({
                                el: locator,
                                timeout: getTime() + 5,
                                list: {
                                    trustRegion: undefined,
                                    last: undefined
                                },
                                graph: {
                                    trustRegion: undefined,
                                    last: locator
                                }
                            });
                        }
                        break;
                    }
                }
            }
        };

        node.addEventListener("scroll", listener);
        return () => {
            if (node) {
                node.removeEventListener("scroll", listener);
            }
        }
    }, [requestedDate, setRequestedDate]));

    // Scroll to position if we get a request
    useEffect(() => {
        const node = document.getElementById("weekMoodGraph");
        if (!node) return;
        if (requestedDate.el && requestedDate.el[0] === "i") {
            const id = "g" + requestedDate.el.slice(1);
            const el = node.querySelector("#" + id);
            if (el) {
                node.scrollTo({
                    top: 0,
                    left: (el.offsetLeft + el.offsetWidth) - (node.offsetLeft + node.offsetWidth) + 8,
                    behavior: "smooth"
                })
            }
        }
    }, [requestedDate]);

    let els = [];
    let i = 0;
    let current = getDate(logs[0]);

    // Create cards from today to first entry
    let now = DateTime.now();
    now = DateTime.fromObject({year: now.year, month: now.month, day: now.day});
    while (!now.equals(current) && !now.isBefore(current)) {
        els.push(createGraphCard(current));
        now = now.minus({days: 1});
    }

    while (i < logs.length) {
        let todaysLogs = [];
        while (i < logs.length && getDate(logs[i]).equals(current)) {
            todaysLogs.push(logs[i]);
            i++;
        }

        // Create card for current day
        els.push(createGraphCard(current, todaysLogs));
        if (i === logs.length) break;

        // Create cards back to next populated day
        let next = getDate(logs[i]);
        while (!current.equals(next)) {
            current = current.minus({ days: 1 });
            if (!current.equals(next)) els.push(createGraphCard(current));
        }
    }

    // Create empty cards for final week
    for (let i = 0; i < 6; i++) {
        current = current.minus({ days: 1 });
        els.push(createGraphCard(current));
    }

    return (
        <div id="weekMoodGraph" ref={container} className="week-mood-graph">
            { els }
        </div>
    );
};

export default WeekMoodGraph;