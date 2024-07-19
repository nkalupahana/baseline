import { useMemo } from "react";
import { calculateStreak } from "../../helpers";
import { Log } from "../../db";

interface Props {
    logs: Log[];
}

const StreakBadge = ({ logs } : Props) => {
    const streak = useMemo(() => calculateStreak(logs), [logs]);

    return <p>Streak: { streak } days</p>;
};

export default StreakBadge;