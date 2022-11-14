import "./WeekMoodGraph.css";
import { DateTime } from "luxon";
import { useEffect, useCallback, useState } from "react";
import useCallbackRef from "../../../useCallbackRef";
import { COLORS, COLORS_CB, createPoints, getDateFromLog, getTime, parseSettings } from "../../../helpers";
import { IonIcon } from "@ionic/react";
import { caretUp } from "ionicons/icons";

function createGraphCard(date, colors, data=[]) {
    const points = createPoints(data, colors);

    const locator = "g-locator-" + date.toISODate();
    return (<div key={locator} id={locator} className="graph-card">
                <div className="graph-card-date">{date.toFormat("ccc")}</div>
                <div className="graph-card-date">{date.toFormat("L/d")}</div>
                <div className="graph-card-line"></div>
                {points}
            </div>);
}

const TRUST_BOUND = 25;
function getBound(el, node) {
    const elBox = el.getBoundingClientRect();
    const nodeBox = node.getBoundingClientRect();
    return (elBox.x + elBox.width) - (nodeBox.x + nodeBox.width) - elBox.width / 2;
}

const WeekMoodGraph = ({ requestedDate, setRequestedDate, logs }) => {
    const settings = parseSettings();
    const [els, setEls] = useState([]);
    const colors = settings["colorblind"] ? COLORS_CB : COLORS;

    const container = useCallbackRef(useCallback(node => {
        if (!node) return;
        const listener = e => {
            if (e.timeStamp < 1000) return;
            if (requestedDate.el && requestedDate.el[0] === "i" && requestedDate.timeout > getTime()) {
                // Computer-generated scroll event -- so we're checking to see
                // if we've made it to the requested element
                const id = "g" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const bound = getBound(el, node);
                    // If we have, remove it
                    // and set it to the trust region
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
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
                if (requestedDate.graph.trustRegion) {
                    // If we're in the trust region, it might not be a user scroll,
                    // so let's check for that
                    const bound = getBound(requestedDate.graph.trustRegion, node);
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
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
                        });
                    }
                }

                // Otherwise, let's get the new position the user
                // has scrolled to, and if it's a new place sync the list to it
                for (let child of node.children) {
                    // node.offsetWidth / 15 accounts for the arrow,
                    // so we only scroll over when the arrow on the graph moves over
                    if (child.getBoundingClientRect().x < node.getBoundingClientRect().right - (node.offsetWidth / 15)) {
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
                    left: (el.offsetLeft + el.offsetWidth) - (node.offsetLeft + node.offsetWidth),
                    behavior: settings.reduceMotion ? "auto" : "smooth"
                });
            }
        }
    }, [requestedDate, settings.reduceMotion]);

    useEffect(() => {
        let els = [];
        let i = 0;
        let current = getDateFromLog(logs[0]);

        // Create cards from today to first entry
        let now = DateTime.now().startOf("day");
        while (!now.equals(current) && now > current) {
            els.push(createGraphCard(now, colors));
            now = now.minus({days: 1});
        }

        while (i < logs.length) {
            let todaysLogs = [];
            while (i < logs.length && getDateFromLog(logs[i]).equals(current)) {
                todaysLogs.push(logs[i]);
                i++;
            }

            // Create card for current day
            els.push(createGraphCard(current, colors, todaysLogs));
            if (i === logs.length) break;

            // Create cards back to next populated day
            let next = getDateFromLog(logs[i]);
            while (!current.equals(next)) {
                current = current.minus({ days: 1 });
                if (!current.equals(next)) els.push(createGraphCard(current, colors));
            }
        }

        // Create empty cards for final week
        for (let i = 0; i < 6; i++) {
            current = current.minus({ days: 1 });
            els.push(createGraphCard(current, colors));
        }

        setEls(els);
    }, [logs, colors]);

    return (
        <>
            <div id="weekMoodGraph" ref={container} style={{ gridArea: "graph" }} className="week-mood-graph">
                { els }
            </div>
            <IonIcon className="graph-arrow" icon={caretUp}></IonIcon>
        </>
    );
};

export default WeekMoodGraph;