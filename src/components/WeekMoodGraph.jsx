import "./WeekMoodGraph.css";
import { DateTime } from "luxon";
import { useEffect, useCallback } from "react";
import useCallbackRef from "../useCallbackRef";
import { getTime } from "../helpers";

function getDate(log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

function createGraphCard(date) {
    return <div key={"g-locator-" + date.toISODate()} id={"g-locator-" + date.toISODate()} className="graph-card"><div className="graph-card-date">{date.toISODate()}</div></div>;
}

// TODO: fallback timeout
const ARROW_OFFSET = 20;
const WeekMoodGraph = ({ requestedDate, setRequestedDate, logs }) => {
    const container = useCallbackRef(useCallback(node => {
        if (!node) return;
        const listener = e => {
            if (requestedDate.el && requestedDate.el[0] === "i" && requestedDate.timeout > getTime()) {
                // Computer-generated scroll event
                const id = "g" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const elBox = el.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (node.offsetLeft + node.offsetWidth) + 8
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
                if (requestedDate.trustRegionGraph) {
                    const elBox = requestedDate.trustRegionGraph.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (node.offsetLeft + node.offsetWidth) + 8
                    if (bound < 20 && bound > -20) {
                        return;
                    } else {
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
        console.log("graph - attach");
        return () => {
            if (node) {
                console.log("graph - detach");
                node.removeEventListener("scroll", listener);
            }
        }
    }, [requestedDate, setRequestedDate]));

    // Scroll to final position
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
        while (i < logs.length && getDate(logs[i]).equals(current)) {
            i++;
        }

        // Create card for current day
        els.push(createGraphCard(current));
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
        <div id="weekMoodGraph" ref={container} style={{"display": "flex", "flexDirection": "row-reverse", "overflowX": "scroll", "overflowY": "hidden", "gap": "2px"}}>
            { els }
        </div>
    );
};

export default WeekMoodGraph;