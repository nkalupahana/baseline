import { useEffect, useCallback, useState } from "react";
import useCallbackRef from "../../../useCallbackRef";
import { getTime } from "../../../helpers";
import { IonIcon } from "@ionic/react";
import { searchOutline } from "ionicons/icons";
import MoodLogList from "../MoodLogList";

const TRUST_BOUND = 15;

function getBound(el, node) {
    return node.offsetTop - el.getBoundingClientRect().y + 30;
}

const WeekMoodLogList = ({ logs, setMenuDisabled, requestedDate, setRequestedDate }) => {
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
                if (first <= 10 || second <= 10 || third <= 10) {
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
    }, [requestedDate, setRequestedDate, setShowSearch]));

    return (
        <>
            <div style={showSearch ? {height: "30px"} : {height: "0px", overflow: "hidden"}} className="log-list-expand">
                <IonIcon icon={searchOutline} ></IonIcon> <span style={{fontSize: "14px", position: "relative", bottom: "5px"}}>Search and filter logs</span>
            </div>
            <MoodLogList logs={logs} container={container} setMenuDisabled={setMenuDisabled} reverse={false} requestedDate={requestedDate} />
        </>
    )
}

export default WeekMoodLogList;