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
            <span style={{"gridArea": "time", "paddingLeft": "8px"}}>{ log.time }</span>
            <span style={{"gridArea": "labels"}}>{ symbol } { log.mood }</span>
            { !grow && <IonTextarea style={{"gridArea": "log"}} rows={2} readonly autoGrow={false} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onIonFocus={toggleGrow} /> }
            { grow && <IonTextarea style={{"gridArea": "log"}} readonly autoGrow={true} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onIonFocus={toggleGrow} /> }
        </div>
    );
};

export default MoodLogCard;