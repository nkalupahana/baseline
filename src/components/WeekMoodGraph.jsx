import "./WeekMoodGraph.css";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";

function getDate(log) {
    return DateTime.fromObject({year: log.year, month: log.month, day: log.day});
}

// TODO: fallback timeout
const ARROW_OFFSET = 20;
const WeekMoodGraph = ({ requestedDate, setRequestedDate, logs }) => {
    const container = useRef();
    useEffect(() => {
        if (!container.current) return;
        const listener = e => {
            if (requestedDate.el && requestedDate.el[0] == "i") {
                // Computer-generated scroll event
                const id = "g" + requestedDate.el.slice(1);
                const el = container.current.querySelector("#" + id);
                if (el) {
                    const elBox = el.getBoundingClientRect();
                    const bound = (elBox.x + elBox.width) - (container.current.offsetLeft + container.current.offsetWidth) + 8
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
                    const bound = (elBox.x + elBox.width) - (container.current.offsetLeft + container.current.offsetWidth) + 8
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

                for (let i = 0; i < container.current.children.length; i++) {
                    if (container.current.children[i].getBoundingClientRect().x < container.current.getBoundingClientRect().right - ARROW_OFFSET) {
                        const locator = container.current.children[i].id;
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

        container.current.addEventListener("scroll", listener);
        return () => {
            if (container.current) container.current.removeEventListener("scroll", listener);
        }
    }, [container.current, requestedDate]);

    // Scroll to final position
    useEffect(() => {
        if (requestedDate.el && requestedDate.el[0] == "i") {
            const id = "g" + requestedDate.el.slice(1);
            const el = container.current.querySelector("#" + id);
            if (el) {
                container.current.scrollTo({
                    top: 0,
                    left: (el.offsetLeft + el.offsetWidth) - (container.current.offsetLeft + container.current.offsetWidth) + 8,
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
        if (i == logs.length) break;

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
        <div ref={container} style={{"display": "flex", "flexDirection": "row-reverse", "overflowX": "scroll", "overflowY": "hidden", "gap": "2px"}}>
            { els }
        </div>
    );
};

export default WeekMoodGraph;