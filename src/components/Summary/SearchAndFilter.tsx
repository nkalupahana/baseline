import { IonIcon } from "@ionic/react";
import { imagesOutline } from "ionicons/icons";
import { debounce } from "lodash";
import { MultiSelect } from "react-multi-select-component";

interface Props {
    setSearchText: (text: string) => void;
    numberFilter: number[];
    setNumberFilter: (numbers: number[]) => void;
    averageFilter: string[];
    setAverageFilter: (avgs: string[]) => void;
    imageFilter: boolean;
    setImageFilter: (image: boolean) => void;
    inputClass?: string;
    numLogs: number;
}

interface Selected {
    label: string;
    value: string;
}

const SearchAndFilter = ({ setSearchText, numberFilter, setNumberFilter, averageFilter, setAverageFilter, imageFilter, setImageFilter, inputClass, numLogs } : Props) => {
    const debounceSetSearchText = debounce(setSearchText, 500);

    const expand = (x: any) => {
        return {value: String(x), label: String(x)};
    };
    
    return <>
        <input placeholder="Search" type="text" className={`invisible-input searchbar ${inputClass}`} onChange={e => debounceSetSearchText(e.target.value)}/>
        <span className="filter-selects">
            <MultiSelect 
                labelledBy="" 
                value={numberFilter.map(expand)} 
                onChange={(v: Selected[]) => setNumberFilter(v.map(x => Number(x.value)))} 
                className="filter-number multi" 
                options={[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map(expand)} 
                overrideStrings={{"selectSomeItems": "Mood"}}
                disableSearch={true}
            />
            <span style={{"width": "20px", "height": "100%"}}></span>
            <MultiSelect 
                labelledBy="" 
                value={averageFilter.map(expand)} 
                onChange={(v: Selected[]) => setAverageFilter(v.map(x => x.value))} 
                className="filter-average multi" 
                options={["below", "average", "above"].map(expand)} 
                overrideStrings={{"selectSomeItems": "Average"}}
                disableSearch={true}
            />
            <span style={{"width": "10px", "height": "100%"}}></span>
            <IonIcon onClick={() => setImageFilter(!imageFilter)} style={imageFilter ? {"color": "lightblue"} : {}} className="image-btn" icon={imagesOutline} />
        </span>
        <p id="search-num-results" className="margin-top-12 text-center margin-bottom-0" style={{"fontSize": "16px"}}>{ numLogs } { numLogs === 1 ? "entry" : "entries" }</p>
    </>
};

export default SearchAndFilter;