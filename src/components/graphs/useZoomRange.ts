import { useEffect, useMemo } from "react";
import { AnyMap } from "../../helpers";
import { ONE_DAY } from "./helpers";

const useZoomRange = (now: number, data: AnyMap[], setXZoomDomain: (domain: [number, number] | undefined) => void) => {
    const dataRange = useMemo(() => {
        return now - data[0].timestamp;
    }, [now, data]);

    const minimumZoom = useMemo(() => {
        if (data.length === 1) return 0;
        return Math.min(ONE_DAY * 60, dataRange);
    }, [data, dataRange, data]);

    useEffect(() => {
        if (data.length === 1) {
            setXZoomDomain(undefined);
        } else if (dataRange < ONE_DAY * 180) {
            setXZoomDomain([now - dataRange - ONE_DAY, now]);
        } else {
            setXZoomDomain([now - ONE_DAY * 180, now]);
        }
    }, [now, dataRange, setXZoomDomain, data]);

    const maxDomain = useMemo(() => {
        if (data.length === 1) return undefined;
        return now + ONE_DAY;
    }, [now, data]);
    
    return [dataRange, minimumZoom, maxDomain];
}

export default useZoomRange;