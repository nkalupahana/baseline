import { DateTime } from "luxon";
import { useMemo } from "react";
import { Curve, VictoryLabel, LineSegment } from "victory";
import { AnyMap } from "../../helpers";

export interface GraphProps {
    xZoomDomain: undefined | [number, number];
    setXZoomDomain: (domain: undefined | [number, number]) => void;
    data: any[];
    now: number;
    pageWidth: number
    tickCount: number
    tickFormatter: (timestamp: number) => string
}

export const formatDateTick = (timestamp: number, thisYear: number) => {
    const dt = DateTime.fromMillis(timestamp)
    if (dt.year === thisYear) {
        return dt.toFormat("LLL d");
    } else {
        return dt.toFormat("LLL d yy");
    }
}

export const ONE_DAY = 86400 * 1000;

export const MultiCurve = (props: any) => {
    // Precondition: assumes dates are in descending order
    const datas = useMemo(() => {
        const FOURTEEN_DAYS = ONE_DAY * 14;
        let ret: any[][] = [[]];
        for (let data of props.data) {
            let lastArray = ret[ret.length - 1];
            if (lastArray.length !== 0) {
                if (data.timestamp - lastArray[lastArray.length - 1].timestamp > FOURTEEN_DAYS) {
                    ret.push([]);
                }
            }

            ret[ret.length - 1].push(data);
        }

        return ret;
    }, [props.data]);

    return (
        <>
            {datas?.map((data, i) => (
                <Curve key={data.map((d) => d.timestamp).join(",")} {...props} data={data} />
            ))}
        </>
    );
};

export const CustomLineSegment = (props: any) => {
    if (props.xcutoff && props.x1 < props.xcutoff) return <></>;
    return <LineSegment {...props} x1={props.x1 + (props.dx1 ?? 0)} />;
};

export const CustomVictoryLabel = (props: any) => {
    if (props.xcutoff && props.x < props.xcutoff) return <></>;
    return <VictoryLabel {...props} y={props.y + (props.dy1 ?? 0)} x={props.x + (props.dx1 ?? 0)} />;
};

export const BlockerRectangle = (props: any) => {
    return <rect x="0" y="0" width="80" height="350" style={{ fill: "var(--ion-background-color)" }} />;
};

interface GraphHeaderProps {
    lines: AnyMap[]
    keyMap: AnyMap
    zoomTo: (key: "3M" | "6M" | "1Y" | "All") => void;
}

export const GraphHeader = ({ lines, keyMap, zoomTo } : GraphHeaderProps) => {
    return <div style={{
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
    }}>
        <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            {lines.map((line) => <>
                <div style={{
                    height: "12px",
                    width: "12px",
                    backgroundColor: line.color,
                    borderRadius: "2px",
                    marginRight: "8px",
                }}></div>
                <div style={{
                    marginRight: "12px",
                }}>{keyMap[line.y]}</div>
            </>)}
        </div>
        <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            <p>Zoom</p>
            <div onClick={() => zoomTo("3M")} className="outline-button">3M</div>
            <div onClick={() => zoomTo("6M")} className="outline-button">6M</div>
            <div onClick={() => zoomTo("1Y")} className="outline-button">1Y</div>
            <div onClick={() => zoomTo("All")} className="outline-button">All</div>
        </div>
    </div>
}