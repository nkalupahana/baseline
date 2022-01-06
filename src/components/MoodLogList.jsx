import { DateTime } from "luxon";
import { useEffect, useRef } from "react";
import MoodLogCard from "./MoodLogCard";

const MoodLogList = ({ logs, requestedDate, setRequestedDate }) => {
    const container = useRef();

    // Confirm final position
    useEffect(() => {
        if (!container.current) return;
        const listener = e => {
            const parentBox = container.current.getBoundingClientRect();
            if (requestedDate.el && requestedDate.el[0] === "g") {
                // Computer-generated scroll event
                const id = "i" + requestedDate.el.slice(1);
                const el = container.current.querySelector("#" + id);
                if (el) {
                    const bound = container.current.offsetTop - el.getBoundingClientRect().y + 30;
                    if (bound < 15 && bound > -15) {
                        setRequestedDate({
                            el: undefined,
                            list: {
                                trustRegion: el,
                                last: id
                            },
                            graph: requestedDate.graph
                        });
                    }
                }
            } else {
                if (requestedDate.list.trustRegion) {
                    const bound = container.current.offsetTop - requestedDate.list.trustRegion.getBoundingClientRect().y + 30;
                    if (bound < 15 && bound > -15) {
                        return;
                    } else {
                        setRequestedDate({
                            el: requestedDate.el,
                            list: {
                                trustRegion: undefined,
                                last: requestedDate.list.last
                            },
                            graph: requestedDate.graph
                        })
                    }
                }

                for (let child of container.current.children) {
                    if (child.tagName !== "P") continue;
                    const childBox = child.getBoundingClientRect();
                    if (childBox.y > parentBox.top && childBox.y < parentBox.top + (parentBox.height / 3)) {
                        if (child.id !== requestedDate.el && child.id !== requestedDate.list.last) {
                            setRequestedDate({
                                el: child.id,
                                list: {
                                    trustRegion: undefined,
                                    last: child.id
                                },
                                graph: {
                                    trustRegion: undefined,
                                    last: undefined
                                }
                            });
                            break;
                        }
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
        if (requestedDate.el && requestedDate.el[0] === "g") {
            const id = "i" + requestedDate.el.slice(1);
            const el = container.current.querySelector("#" + id);
            if (el) {
                container.current.scrollTo({
                    top: el.offsetTop - container.current.offsetTop - 30,
                    left: 0,
                    behavior: "smooth"
                })
            }
        }
    }, [requestedDate]);

    let els = [];
    let top = false;
    const now = DateTime.now();
    const zone = now.zone.offsetName(now.toMillis(), { format: "short" });
    for (let log of logs) {
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            top = log;
            const t = DateTime.fromObject({ year: log.year, month: log.month, day: log.day });
            els.push(
                <p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${top.month}${top.day}${top.year}`}>
                    {top.month}/{top.day}/{top.year}
                </p>
            );
        }

        if (log.zone !== zone && !log.time.includes(log.zone)) {
            log.time += " " + log.zone;
        }

        els.push(<MoodLogCard key={log.timestamp} log={log} />);
    }

    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    return (
        <div ref={container} className="mood-log-list">
            { els }
        </div>
    );
}

export default MoodLogList;