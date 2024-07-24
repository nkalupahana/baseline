import { useContext } from "react";
import { IonIcon } from "@ionic/react";
import { flame } from "ionicons/icons";
import "./StreakBadge.css";
import StreakContext from "./StreakContext";

const StreakBadge = () => {
    const streak = useContext(StreakContext);

    return <p className="sb-badge">
        <IonIcon className="sb-icon" icon={flame} /> { streak }
    </p>;
};

export default StreakBadge;