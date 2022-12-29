import "./MoodLogCard.css";
import { IonIcon } from "@ionic/react";
import { caretDownOutline, caretForwardOutline, caretUpOutline } from "ionicons/icons";
import { AnyMap, COLORS } from "../../helpers";

export interface SimpleLog {
    time: string,
    mood: number,
    average: string,
    journal: string
}

const StaticMoodLogCard = ({ log } : { log: SimpleLog }) => {
    const SYMBOL_MAP: AnyMap = {
        "below": caretDownOutline,
        "average": caretForwardOutline,
        "above": caretUpOutline
    };

    return (
        <div className="mood-card">
            <span className="bold" style={{"gridArea": "time", "paddingLeft": "8px"}}>{ log.time }</span>
            <span className="bold" style={{"gridArea": "labels", "paddingRight": "10px", "textAlign": "right"}}>
                <div className="display-point" style={{"backgroundColor": COLORS[log.mood]}}></div>
                <IonIcon style={{"transform": "translateY(2px)"}} icon={SYMBOL_MAP[log.average]} /> { log.mood }
            </span>
            <div 
                className="mood-card-log" 
                style={{"height": "auto"}}
            >
                { log.journal }
            </div>
        </div>
    );
};

export default StaticMoodLogCard;