import { useEffect, useMemo } from "react";
import { AnyMap } from "../../helpers";
import { ONE_DAY } from "./helpers";

const useZoomRange = (now: number, data: AnyMap[], setXZoomDomain: (domain: [number, number] | undefined) => void) => {
    const dataRange = useMemo(() => {
        return now - data[0].timestamp;
    }, [now, data]);

    const minimumZoom = useMemo(() => {
        return Math.min(ONE_DAY * 60, dataRange);
    }, [dataRange]);

    useEffect(() => {
        if (dataRange < ONE_DAY * 180) {
            setXZoomDomain(undefined);
        } else {
            setXZoomDomain([now - ONE_DAY * 180, now]);
        }
    }, [now, dataRange, setXZoomDomain]);
    
    return [dataRange, minimumZoom];
}

export default useZoomRange;