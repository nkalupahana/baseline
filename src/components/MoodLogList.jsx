import { DateTime } from "luxon";
import { useEffect, useCallback, useState } from "react";
import useCallbackRef from "../useCallbackRef";
import MoodLogCard from "./MoodLogCard";
import { getTime } from "../helpers";
import { IonIcon } from "@ionic/react";
import { searchOutline } from "ionicons/icons";

const TRUST_BOUND = 15;

function getBound(el, node) {
    return node.offsetTop - el.getBoundingClientRect().y + 30;
}

const MoodLogList = ({ logs, requestedDate, setRequestedDate }) => {
    const [showSearch, setShowSearch] = useState(true);

    const container = useCallbackRef(useCallback(node => {
        const lastPositions = [];
        if (!node) return;
        const listener = e => {
            if (e.timestamp < 1000) return;
            lastPositions.push(node.scrollTop);
            if (lastPositions.length > 3) lastPositions.shift();
            if (lastPositions.length === 3) {
                const [first, second, third] = lastPositions;
                if (first <= 0 || second <= 0 || third <= 0) {
                    setShowSearch(true);
                } else if (first > second && second > third) {
                    setShowSearch(true);
                } else if (first < second && second < third) {
                    setShowSearch(false);
                }
            }

            const parentBox = node.getBoundingClientRect();
            if (requestedDate.el && requestedDate.el[0] === "g" && requestedDate.timeout > getTime()) {
                // Computer-generated scroll event -- so we're checking to see
                // if we've made it to the requested element
                const id = "i" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const bound = getBound(el, node);
                    // If we have, remove it
                    // and set it to the trust region
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
                        setRequestedDate({
                            el: undefined,
                            timeout: requestedDate.timeout,
                            list: {
                                trustRegion: el,
                                last: id
                            },
                            graph: requestedDate.graph
                        });
                    }
                }
            } else {
                // It's a user scroll (probably)
                if (requestedDate.list.trustRegion) {
                    // If we're in the trust region, it might not be a user scroll,
                    // so let's check for that
                    const bound = getBound(requestedDate.list.trustRegion, node);
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
                        return;
                    } else {
                        // And if we've left the trust region, remove it
                        setRequestedDate({
                            el: requestedDate.el,
                            timeout: requestedDate.timeout,
                            list: {
                                trustRegion: undefined,
                                last: requestedDate.list.last
                            },
                            graph: requestedDate.graph
                        });
                    }
                }

                // Otherwise, let's get the new position the user
                // has scrolled to, and if it's a new place sync the graph to it
                for (let child of node.children) {
                    if (child.tagName !== "P") continue;
                    const childBox = child.getBoundingClientRect();
                    if (childBox.y > parentBox.top && childBox.y < parentBox.top + (parentBox.height / 3)) {
                        if (child.id !== requestedDate.el && child.id !== requestedDate.list.last) {
                            setRequestedDate({
                                el: child.id,
                                timeout: getTime() + 5,
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

        node.addEventListener("scroll", listener);
        return () => {
            if (node) {
                node.removeEventListener("scroll", listener);
            }
        }
    }, [requestedDate, setRequestedDate, showSearch, setShowSearch]));

    // Scroll to position if we get a request
    useEffect(() => {
        const node = document.getElementById("moodLogList");
        if (!node) return;
        if (requestedDate.el && requestedDate.el[0] === "g") {
            const id = "i" + requestedDate.el.slice(1);
            const el = node.querySelector("#" + id);
            if (el) {
                node.scrollTo({
                    top: el.offsetTop - node.offsetTop - 30,
                    left: 0,
                    behavior: "smooth"
                })
            }
        }
    }, [requestedDate]);

    let els = [<br key="begin"/>];
    let top = false;
    const now = DateTime.now();
    const zone = now.zone.offsetName(now.toMillis(), { format: "short" });
    let today = [];
    for (let log of logs) {
        if (!top || top.day !== log.day || top.month !== log.month || top.year !== log.year) {
            els.push(today.reverse());
            today = [];
            top = log;
            const t = DateTime.fromObject({ year: log.year, month: log.month, day: log.day });
            els.push(
                <p id={"i-locator-" + t.toISODate()} className="bold text-center" key={`${top.month}${top.day}${top.year}`}>
                    { t.toFormat("DDDD") }
                </p>
            );
        }

        if (log.zone !== zone && !log.time.includes(log.zone)) {
            log.time += " " + log.zone;
        }

        today.push(<MoodLogCard key={log.timestamp} log={log} />);
    }

    els.push(today.reverse());
    els.push(
        <div className="bold text-center" key="end">
            <p>no more logs</p>
            <br />
        </div>
    );

    return (
        <>
            <div style={showSearch ? {height: "30px"} : {height: "0px", overflow: "hidden"}} className="log-list-expand">
                <IonIcon icon={searchOutline} ></IonIcon> <span style={{fontSize: "14px", position: "relative", bottom: "5px"}}>Search and filter logs</span>
            </div>
            <div ref={container} id="moodLogList" className="mood-log-list">
                { els }
            </div>
        </>
    );
}

export default MoodLogList;