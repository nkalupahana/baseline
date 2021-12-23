import "./MoodLogCard.css";
import { IonTextarea } from "@ionic/react";
import { useState } from "react";
import { Log } from "../db";

const MoodLogCard = ({ log } : { log: Log }) => {
    const [grow, setGrow] = useState(false);

    function toggleGrow() {
        setGrow(!grow);
    }

    // TODO: temp, need to be turned into official symbols
    let symbol;
    if (log.average === "average") symbol = "~";
    if (log.average === "above") symbol = "↑";
    if (log.average === "below") symbol = "↓";

    return (
        <div className="mood-card">
            <span className="bold" style={{"gridArea": "time", "paddingLeft": "8px"}}>{ log.time }</span>
            <span className="bold" style={{"gridArea": "labels", "paddingRight": "10px", "textAlign": "right"}}>{ symbol } { log.mood }</span>
            { !grow && <IonTextarea style={{"gridArea": "log"}} rows={2} readonly autoGrow={false} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} /> }
            { grow && <IonTextarea style={{"gridArea": "log"}} readonly autoGrow={true} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} /> }
        </div>
    );
};

export default MoodLogCard;