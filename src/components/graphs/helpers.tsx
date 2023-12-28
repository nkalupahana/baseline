import { DateTime } from "luxon";
import { Fragment, useMemo } from "react";
import { Curve, VictoryLabel, LineSegment, VictoryAxis, VictoryLine } from "victory";
import { AnyMap } from "../../helpers";

export interface GraphProps {
    xZoomDomain: undefined | [number, number];
    setXZoomDomain: (domain: undefined | [number, number]) => void;
    data: any[];
    now: number;
    pageWidth: number
    tickCount: number
    tickFormatter: (timestamp: number) => string
    zoomTo: (key: "3M" | "6M" | "1Y" | "All") => void;
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
    // Precondition: assumes dates are in ascending order
    const datas = useMemo(() => {
        const FOURTEEN_DAYS = ONE_DAY * (props.days ?? 14);
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
    }, [props.data, props.days]);

    return (
        <>
            {datas.map((data, i) => (
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
    dataRange: number | undefined
}

export const GraphHeader = ({ lines, keyMap, zoomTo, dataRange } : GraphHeaderProps) => {
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
            {lines.map((line) => <Fragment key={line.y}>
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
            </Fragment>)}
        </div>
        <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            <p>Zoom</p>
            {((dataRange ?? 0) > (ONE_DAY * 90)) && <div onClick={() => zoomTo("3M")} className="outline-button">3M</div>}
            {((dataRange ?? 0) > (ONE_DAY * 180)) && <div onClick={() => zoomTo("6M")} className="outline-button">6M</div>}
            {((dataRange ?? 0) > (ONE_DAY * 365)) && <div onClick={() => zoomTo("1Y")} className="outline-button">1Y</div>}
            <div onClick={() => zoomTo("All")} className="outline-button">All</div>
        </div>
    </div>
}

export const VictoryDateAxis = (props: any) => {
    const tickCount = useMemo(() => {
        return Math.min(props.tickCount, props.data.length);
    }, [props.data, props.tickCount]);

    return <VictoryAxis
        {...props}
        crossAxis
        tickFormat={props.tickFormatter}
        style={{
            grid: { stroke: "none" },
            tickLabels: { padding: 20, angle: -45},
        }}
        axisComponent={<CustomLineSegment dx1={20} />}
        tickComponent={<CustomLineSegment xcutoff={80} />}
        tickLabelComponent={<CustomVictoryLabel xcutoff={80} dx1={props.flippedAxis ? 16 : -16} />}
        tickCount={tickCount}
    />;
}

export const DefaultLine = (props: any) => {
    return <VictoryLine
        {...props}
        key={props.line.y}
        data={props.data}
        scale={{ x: "time", y: "linear" }}
        x="timestamp"
        y={props.line.y}
        style={{
            data: { stroke: props.line.color },
        }}
        interpolation="monotoneX"
        dataComponent={<MultiCurve days={props.days} />}
    />
}