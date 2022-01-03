import "./MoodLogCard.css";
import { IonIcon, IonTextarea } from "@ionic/react";
import {  useRef, useState } from "react";
import { chevronUp, imagesOutline } from "ionicons/icons";

const MoodLogCard = ({ log }) => {
    const [grow, setGrow] = useState(false);
    const card = useRef();

    function toggleGrow() {
        if (!grow) {
            if (log.files || card.current.offsetHeight !== card.current.children[0].children[0].scrollHeight) {
                setGrow(true);
            }
        } else {
            setGrow(false);
        }
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
            { log.journal && 
                <>
                    { !grow && 
                    <>
                        <IonTextarea ref={card} style={{"gridArea": "log"}} rows={2} readonly autoGrow={false} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" onClick={toggleGrow} />
                        { log.files && <IonIcon className="close-btn" icon={imagesOutline} onClick={toggleGrow} /> }
                    </> }
                    { grow && 
                    <>
                        <IonTextarea ref={card} style={{"gridArea": "log"}} readonly autoGrow={true} className="tx tx-display tx-card" value={log.journal} placeholder="No mood log" /> 
                        <IonIcon className="close-btn" icon={chevronUp} onClick={toggleGrow} />
                    </> }
                </>
            }
        </div>
    );
};

export default MoodLogCard;