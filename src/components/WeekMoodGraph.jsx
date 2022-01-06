import "./WeekMoodGraph.css";
import { DateTime } from "luxon";
import { useEffect, useCallback } from "react";
import useCallbackRef from "../useCallbackRef";

function getDate(log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

// TODO: fallback timeout
const ARROW_OFFSET = 20;
const WeekMoodGraph = ({ requestedDate, setRequestedDate, logs }) => {
    const container = useCallbackRef(useCallback(node => {
        if (!node) return;
        const listener = e => {
            if (requestedDate.el && requestedDate.el[0] === "i") {
                // Computer-generated scroll event
                const id = "g" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const elBox = el.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (node.offsetLeft + node.offsetWidth) + 8
                    if (bound < 20 && bound > -20) {
                        setRequestedDate({
                            el: undefined,
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
                            list: requestedDate.list,
                            graph: {
                                trustRegion: undefined,
                                last: requestedDate.graph.last
                            }
                        })
                    }
                }

                for (let i = 0; i < node.children.length; i++) {
                    if (node.children[i].getBoundingClientRect().x < node.getBoundingClientRect().right - ARROW_OFFSET) {
                        const locator = node.children[i].id;
                        if (locator !== requestedDate.el && locator !== requestedDate.graph.last) {
                            setRequestedDate({
                                el: locator,
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

    if (!logs) return <></>;

    // TODO: add days up to today at the front
    let els = [];
    let i = 0;
    let current = getDate(logs[0]);
    while (i < logs.length) {
        let el = <div key={"g-locator-" + current.toISODate()} id={"g-locator-" + current.toISODate()} className="graph-card"><div className="graph-card-date">{current.toISODate()}</div></div>;
        while (i < logs.length && getDate(logs[i]).equals(current)) {
            i++;
        }

        els.push(el);
        if (i === logs.length) break;

        let next = getDate(logs[i]);
        while (!current.equals(next)) {
            current = current.minus({ days: 1 });
            if (!current.equals(next)) els.push(<div key={"g-locator-" + current.toISODate()} id={"g-locator-" + current.toISODate()} className="graph-card"><div className="graph-card-date">{current.toISODate()}</div></div>);
        }
    }
    for (let i = 0; i < 6; i++) {
        current = current.minus({ days: 1 });
        els.push(<div key={"g-locator-" + current.toISODate()} id={"g-locator-" + current.toISODate()} className="graph-card"><div className="graph-card-date">{current.toISODate()}</div></div>);
    }

    return (
        <div id="weekMoodGraph" ref={container} style={{"display": "flex", "flexDirection": "row-reverse", "overflowX": "scroll", "overflowY": "hidden", "gap": "2px"}}>
            { els }
        </div>
    );
};

export default WeekMoodGraph;