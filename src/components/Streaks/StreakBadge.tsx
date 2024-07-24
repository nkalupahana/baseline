import { useContext } from "react";
import { IonIcon } from "@ionic/react";
import { flame } from "ionicons/icons";
import "./StreakBadge.css";
import StreakContext from "./StreakContext";
import { share } from "./helpers";

interface Props {
    shareOnClick?: boolean;
}

const StreakBadge = ({ shareOnClick } : Props) => {
    const streak = useContext(StreakContext);

    return (
        <p className="sb-badge" style={shareOnClick ? {"cursor": "pointer"} : {}} onClick={() => {
                if (shareOnClick) share(`I have a ${streak}-day journaling streak on baseline! Try it out and join me. https://getbaseline.app`);
            }}>
                <IonIcon className="sb-icon" icon={flame} /> { streak }
        </p>);
};

export default StreakBadge;