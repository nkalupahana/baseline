import { DateTime } from "luxon";
import { useEffect, useMemo, useRef, useState } from "react";
import { ONE_DAY } from "./helpers";
import "chartjs-adapter-luxon";
import "./Graphs.css";

const useGraphConfig = () => {
    // now value
    const now = useMemo(() => {
        return DateTime.now().toMillis();
    }, []);
    
    // Zoom/width management
    const [xZoomDomain, setXZoomDomain] = useState<undefined | [number, number]>([now - ONE_DAY * 180, now]);

    const zoomTo = (key: "3M" | "6M" | "1Y" | "All") => {
        const lateTime = xZoomDomain ? xZoomDomain[1] : now;
        if (key === "3M") {
            setXZoomDomain([lateTime - ONE_DAY * 90, lateTime]);
        } else if (key === "6M") {
            setXZoomDomain([lateTime - ONE_DAY * 180, lateTime]);
        } else if (key === "1Y") {
            setXZoomDomain([lateTime - ONE_DAY * 365, lateTime]);
        } else if (key === "All") {
            setXZoomDomain(undefined);
        }
    };

    const pageWidthRef = useRef<null | HTMLDivElement>(null);
    const [pageWidth, setPageWidth] = useState(0);
    useEffect(() => {
        if (!pageWidthRef.current) return;

        const listener = () => {
            if (!pageWidthRef.current) return;
            setPageWidth(pageWidthRef.current.getBoundingClientRect().width);
        };

        window.addEventListener("resize", listener);
        listener();

        return () => {
            window.removeEventListener("resize", listener);
        };
    }, []);

    // Tick management
    const tickCount = useMemo(() => {
        let ticks = pageWidth * 0.0170811;
        if (ticks < 6) ticks = 6;
        return Math.round(ticks);
    }, [pageWidth]);

    return { now, xZoomDomain, setXZoomDomain, zoomTo, pageWidthRef, pageWidth, tickCount };
}

export default useGraphConfig;

