import { useMemo, useRef, useState } from "react";
import { AnyMap } from "../../helpers";
import { ONE_DAY } from "./helpers";
import { DateTime } from "luxon";
import "chartjs-adapter-luxon";
import "./Graphs.css";

const useGraphConfig = (data: AnyMap[]) => {
    const [id, setId] = useState<number | undefined>(undefined);
    const canvas = useRef(null);

    const now = useMemo(() => {
        return DateTime.now().toMillis();
    }, []);

    const dataRange = useMemo(() => {
        if (data.length === 1) return 0;
        return now - data[0].timestamp;
    }, [now, data]);

    const minimumZoom = useMemo(() => {
        if (data.length === 1) return 0;
        return Math.min(ONE_DAY * 60, dataRange);
    }, [data, dataRange]);

    const startMinimum = useMemo(() => {
        if (data.length === 1) return 0;
        return now - Math.min(ONE_DAY * 180, dataRange);
    }, [data, dataRange, now]);

    const yRange = useMemo(() => {
        const min = Math.min(...data.map(d => d.value));
        const max = Math.max(...data.map(d => d.value));
        return { min: min - 0.4, max: max + 0.4 };
    }, [data]);

    const minimumValue = useMemo(() => {
        return data[0].timestamp;
    }, [data]);
    
    return { canvas, id, setId, dataRange, minimumZoom, yRange, startMinimum, minimumValue, now };
}

export default useGraphConfig;