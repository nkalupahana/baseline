import { useMemo, useRef, useState } from "react";
import { AnyMap } from "../../helpers";
import { ONE_DAY } from "./helpers";
import { DateTime } from "luxon";
import "chartjs-adapter-luxon";
import "./Graphs.css";

const PADDING = ONE_DAY;

const useGraphConfig = (data: AnyMap[]) => {
    const [id, setId] = useState<number | undefined>(undefined);
    const canvas = useRef(null);

    /// Memoized Values
    // Now timestamp
    const now = useMemo(() => {
        return DateTime.now().toMillis();
    }, []);

    // Padded min and max for x axis
    const leftLimit = useMemo(() => {
        return data[0].timestamp - PADDING;
    }, [data]);

    const rightLimit = useMemo(() => {
        if (data.length === 1) return data[0].timestamp + PADDING;
        return now + PADDING;
    }, [data.length, now]);

    // Range for min to max
    const dataRange = useMemo(() => {
        return rightLimit - leftLimit;
    }, [rightLimit, leftLimit]);

    // Minimum zoom level
    const minimumZoom = useMemo(() => {
        return Math.min(ONE_DAY * 60, dataRange);
    }, [dataRange]);

    // Where to start left side of graph (cut off at 180 day range)
    const startMinimum = useMemo(() => {
        return rightLimit - Math.min(ONE_DAY * 180, dataRange);
    }, [dataRange, rightLimit]);

    return { canvas, id, setId, dataRange, minimumZoom, startMinimum, leftLimit, rightLimit };
}

export default useGraphConfig;