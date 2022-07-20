import { Log } from "../../../db";
import WeekMoodLogList from "./WeekMoodLogList";
import WeekMoodGraph from "./WeekMoodGraph";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { IonIcon } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { debounce } from "lodash";
import { filterLogs } from "../../../helpers";

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
    const debounceSetSearchText = debounce(setSearchText, 500);

    useEffect(() => {
        filterLogs(searchText, logs, setFilteredLogs);
    }, [searchText, logs]);
    
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
            { !search.get && <div style={{ gridArea: "heading" }} className="center-summary">
                <div className="title">Here's how your week has been looking.</div>
            </div> }
            { logs && logs.length > 0 && <>
                { !search.get && <WeekMoodGraph requestedDate={requestedDate} setRequestedDate={setRequestedDate} logs={logs}></WeekMoodGraph> }
                { search.get && <div style={{ gridArea: "heading", height: "100px", "display": "flex" }}>
                    <IonIcon style={{"position": "absolute"}} class="top-corner x" icon={closeOutline} onClick={() => search.set(false)}></IonIcon>
                    <input placeholder="Search" type="text" className="invisible-input searchbar week" onChange={e => debounceSetSearchText(e.target.value)}/>
                </div> }
                <WeekMoodLogList 
                    inFullscreen={inFullscreen} 
                    setInFullscreen={setInFullscreen} 
                    logs={searchText ? filteredLogs : logs} 
                    requestedDate={requestedDate} 
                    setRequestedDate={setRequestedDate} 
                    search={search}
                />
            </> }
        </div>
    );
};

export default WeekSummary;
