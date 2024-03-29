import { useCallback, useEffect, useState } from "react";
import useCallbackRef from "../../../useCallbackRef";
import { filterLogs, getMoodLogListBound, getTime } from "../../../helpers";
import MoodLogList from "../MoodLogList";
import SearchAndFilter from "../SearchAndFilter";

const TRUST_BOUND = 15;
const LOCATOR_OFFSET = 120;

const MonthMoodLogList = ({ logs, inFullscreen, setInFullscreen, requestedDate, setRequestedDate }) => {
    const [searchText, setSearchText] = useState("");
    const [filteredLogs, setFilteredLogs] = useState(logs);
    const [numberFilter, setNumberFilter] = useState([]);
    const [averageFilter, setAverageFilter] = useState([]);
    const [imageFilter, setImageFilter] = useState(false);

    useEffect(() => {
        filterLogs(searchText, numberFilter, averageFilter, imageFilter, logs, setFilteredLogs);
    }, [searchText, numberFilter, averageFilter, imageFilter, logs]);
    
    const container = useCallbackRef(useCallback(node => {
        if (!node) return;
        const listener = e => {
            const parentBox = node.getBoundingClientRect();
            if (requestedDate.el && requestedDate.el[0] === "g" && requestedDate.timeout > getTime()) {
                // Computer-generated scroll event -- so we're checking to see
                // if we've made it to the requested element
                const id = "i" + requestedDate.el.slice(1);
                const el = node.querySelector("#" + id);
                if (el) {
                    const bound = getMoodLogListBound(el, node, LOCATOR_OFFSET);
                    // If we have, remove it
                    // and set it to the trust region
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
                        setRequestedDate({
                            ...requestedDate,
                            el: id,
                            list: {
                                trustRegion: el,
                                last: id
                            },
                        });
                    }
                }
            } else {
                // It's a user scroll (probably)
                if (requestedDate.list.trustRegion) {
                    // If we're in the trust region, it might not be a user scroll,
                    // so let's check for that
                    const bound = getMoodLogListBound(requestedDate.list.trustRegion, node, LOCATOR_OFFSET);
                    if (bound < TRUST_BOUND && bound > -TRUST_BOUND) {
                        return;
                    } else {
                        // And if we've left the trust region, remove it
                        setRequestedDate({
                            ...requestedDate,
                            list: {
                                trustRegion: undefined,
                                last: requestedDate.list.last
                            },
                        });
                    }
                }

                // Otherwise, let's get the new position the user
                // has scrolled to, and if it's a new place sync the calendar to it
                for (let child of node.children) {
                    if (child.tagName !== "P") continue;
                    const childBox = child.getBoundingClientRect();
                    if (childBox.y > parentBox.top && childBox.y < parentBox.top + (parentBox.height / 3)) {
                        if (child.id !== requestedDate.el && child.id !== requestedDate.list.last) {
                            setRequestedDate({
                                ...requestedDate,
                                el: child.id.replace("-bottom", ""),
                                timeout: getTime(),
                                list: {
                                    trustRegion: undefined,
                                    last: child.id
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

    return (
        <>
            <div className="log-list-expand filter-area">
                <SearchAndFilter 
                    setSearchText={setSearchText} 
                    averageFilter={averageFilter}
                    setAverageFilter={setAverageFilter} 
                    numberFilter={numberFilter}
                    setNumberFilter={setNumberFilter} 
                    imageFilter={imageFilter}
                    setImageFilter={setImageFilter}
                    numLogs={filteredLogs.length}
                />
            </div>
            <MoodLogList 
                logs={filteredLogs} 
                container={container} 
                inFullscreen={inFullscreen}
                setInFullscreen={setInFullscreen} 
                reverse={true} 
                requestedDate={requestedDate} 
                aHeight={"100vh - 250px"}
                filtered={logs.length !== filteredLogs.length}
                LOCATOR_OFFSET={LOCATOR_OFFSET}
            />
        </>
    )
}

export default MonthMoodLogList;