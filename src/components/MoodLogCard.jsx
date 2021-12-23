import "./MoodLogCard.css";
import { IonTextarea } from "@ionic/react";
import { useState } from "react";

const MoodLogCard = ({ log }) => {
    const [grow, setGrow] = useState(false);

    function toggleGrow() {
        setGrow(!grow);
    }

    let symbol;
    if (log.average == "average") symbol = "~";
    if (log.average == "above") symbol = "↑";
    if (log.average == "below") symbol = "↓";

    return (
        <div className="mood-card">
            <span style={{"gridArea": "time", "paddingLeft": "8px", "fontWeight": "bold"}}>{ log.time }</span>
            <span style={{"gridArea": "labels", "fontWeight": "bold"}}>{ symbol } { log.mood }</span>
            { !grow && <IonTextarea style={{"gridArea": "log"}} rows={2} readonly autoGrow={false} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} /> }
            { grow && <IonTextarea style={{"gridArea": "log"}} readonly autoGrow={true} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} /> }
        </div>
    );
};

export default MoodLogCard;