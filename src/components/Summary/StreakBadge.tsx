import { useMemo } from "react";
import { calculateStreak } from "../../helpers";
import { Log } from "../../db";
import { IonIcon } from "@ionic/react";
import { flame } from "ionicons/icons";
import "./StreakBadge.css";

interface Props {
    logs: Log[];
}

const StreakBadge = ({ logs } : Props) => {
    const streak = useMemo(() => calculateStreak(logs), [logs]);

    return <p className="sb-badge">
        <IonIcon className="sb-icon" icon={flame} /> { streak }
    </p>;
};

export default StreakBadge;