import { Log } from "../../../db";
import WeekMoodLogList from "./WeekMoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { filterLogs } from "../../../helpers";
import SearchAndFilter from "../SearchAndFilter";

interface Props {
    inFullscreen: boolean;
    setInFullscreen: (disabled: boolean) => void;
    search: {
        get: boolean;
        set: (enabled: boolean) => void;
    }
    logs: Log[];
}

const WeekSummary = ({ inFullscreen, setInFullscreen, logs, search } : Props) => {
    const [searchText, setSearchText] = useState("");
    const [filteredLogs, setFilteredLogs] = useState(logs);
    const [numberFilter, setNumberFilter] = useState<number[]>([]);
    const [averageFilter, setAverageFilter] = useState<string[]>([]);
    const [imageFilter, setImageFilter] = useState(false);

    useEffect(() => {
        filterLogs(searchText, numberFilter, averageFilter, imageFilter, logs, setFilteredLogs);
    }, [searchText, numberFilter, averageFilter, imageFilter, logs]);

    // Clear search terms whenever search view
    // is toggled, ensuring view isn't stale later on
    useEffect(() => {
        setSearchText("");
    }, [search.get]);
    
    const [requestedDate, setRequestedDate] = useState({
        el: undefined,
        timeout: undefined,
        list: {
            trustRegion: undefined,
            last: `i-locator-${DateTime.now().toISODate()}`
        },
        graph: {
            trustRegion: undefined,
            last: `g-locator-${DateTime.now().toISODate()}`
        }
    });

    /*
    SCROLL DEBUG LOGGER
    useEffect(() => {
        console.log(requestedDate);
    }, [requestedDate]);
    */

    return (
        <div className="week-summary-grid" style={(logs && logs.length > 0) ? {} : {"height": "100%"}}>
            { !search.get && <div className="center-summary grid-heading">
                <div className="title">Here's how your week has been looking.</div>
            </div> } 
            { logs && logs.length > 0 && <>
                { !search.get && <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs}></WeekMoodGraph> }
                { search.get && <div className="grid-heading grid week">
                    <IonIcon style={{"position": "absolute"}} class="top-corner x" icon={closeOutline} onClick={() => search.set(false)}></IonIcon>
                    <SearchAndFilter 
                        setSearchText={setSearchText} 
                        averageFilter={averageFilter}
                        setAverageFilter={setAverageFilter}
                        numberFilter={numberFilter}
                        setNumberFilter={setNumberFilter}
                        imageFilter={imageFilter}
                        setImageFilter={setImageFilter}
                        inputClass={"week"}
                    />
                </div> }
                <WeekMoodLogList 
                    inFullscreen={inFullscreen} 
                    setInFullscreen={setInFullscreen} 
                    logs={search.get ? filteredLogs : logs} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate} 
                    search={search}
                />
            </> }
        </div>
    );
};

export default WeekSummary;
