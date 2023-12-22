import { VictoryLine, VictoryScatter, VictoryChart, VictoryAxis, VictoryZoomContainer } from "victory";
import { BlockerRectangle, CustomLineSegment, CustomVictoryLabel, MultiCurve, ONE_DAY, GraphProps, GraphHeader } from "./graph-helpers";
import theme from "./graph-theme";
import { AnyMap } from "../../helpers";

const DASSGraph = ({ xZoomDomain, setXZoomDomain, data, now, pageWidth, tickCount, tickFormatter }: GraphProps) => {
    const labels = ["Normal", "Mild", "Moderate", "Severe", "Extremely\nSevere", ""];
    const lines: AnyMap[] = [
        {
            y: "d",
            color: "teal",
        },
        {
            y: "a",
            color: "purple",
        },
        {
            y: "s",
            color: "tomato",
        },
    ];

    const keyMap: AnyMap = {
        d: "Depression",
        a: "Anxiety",
        s: "Stress",
    };

    const jitterMap: AnyMap = {
        d: 0.03,
        a: 0,
        s: -0.03,
    };
    
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
    }

    return (
        <div style={{ height: "400px", width: "100%" }}>
            <GraphHeader lines={lines} keyMap={keyMap} zoomTo={zoomTo} />
            
            <VictoryChart
                theme={theme}
                domainPadding={{ x: [25, 0], y: [0, 0] }}
                containerComponent={
                    <VictoryZoomContainer
                        zoomDimension="x"
                        onZoomDomainChange={(domain) => setXZoomDomain(domain.x as [number, number])}
                        minimumZoom={{ x: ONE_DAY * 60 }}
                        zoomDomain={{ x: xZoomDomain }}
                    />
                }
                maxDomain={{ x: now + ONE_DAY * 3 }}
                width={pageWidth}
            >
                {/* Lines */}
                {lines.map((line) => (
                    <VictoryLine
                        key={line.y}
                        data={data}
                        scale={{ x: "time", y: "linear" }}
                        x="timestamp"
                        y={line.y}
                        style={{
                            data: { stroke: line.color },
                        }}
                        interpolation="monotoneX"
                        dataComponent={<MultiCurve />}
                    />
                ))}

                {/* Points on line */}
                {lines.map((line) => (
                    <VictoryScatter
                        key={line.y}
                        data={data}
                        x="timestamp"
                        y={(d) => {
                            let jitter = 0;
                            for (let letter of ["d", "a", "s"]) {
                                if (letter === line.y) continue;
                                if (d[line.y] === d[letter]) {
                                    jitter = jitterMap[line.y];
                                    break;
                                }
                            }

                            return d[line.y] + jitter;
                        }}
                        style={{
                            data: { fill: line.color },
                        }}
                    />
                ))}

                <BlockerRectangle />
                {/* Date axis (x) */}
                <VictoryAxis
                    crossAxis
                    tickFormat={tickFormatter}
                    style={{
                        grid: { stroke: "none" },
                        tickLabels: { padding: 20, angle: -45},
                    }}
                    axisComponent={<CustomLineSegment dx1={20} />}
                    tickComponent={<CustomLineSegment xcutoff={80} />}
                    tickLabelComponent={<CustomVictoryLabel xcutoff={80} dx1={-16} />}
                    tickCount={tickCount}
                />

                {/* Category axis (y) */}
                <VictoryAxis
                    crossAxis
                    dependentAxis
                    tickValues={[0, 1, 2, 3, 4, 5]}
                    tickFormat={(t) => labels[t]}
                    style={{
                        grid: { stroke: "grey" },
                        tickLabels: { padding: 4 },
                    }}
                    offsetX={80}
                    gridComponent={<CustomLineSegment dx1={30} />}
                    tickLabelComponent={<CustomVictoryLabel dy1={-28} />}
                />
            </VictoryChart>
        </div>
    );
};

export default DASSGraph;
