import { VictoryLegend, VictoryLine, VictoryScatter, VictoryChart, VictoryAxis, VictoryZoomContainer, VictoryTheme } from "victory";
import { BlockerRectangle, CustomLineSegment, CustomVictoryLabel, MultiCurve, ONE_DAY, GraphProps } from "./graph-helpers";
import { DateTime } from "luxon";
import { AnyMap } from "../../helpers";

const DASSGraph = ({ xZoomDomain, setXZoomDomain, data, now }: GraphProps) => {
    const labels = ["Normal", "Mild", "Moderate", "Severe", "Extremely\nSevere", ""];
    const lines = [
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

    return (
        <>
            <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={{ x: [25, 0], y: [0, 0] }}
                containerComponent={
                    <VictoryZoomContainer
                        zoomDimension="x"
                        onZoomDomainChange={(domain) => setXZoomDomain(domain.x as [number, number])}
                        minimumZoom={{ x: ONE_DAY * 40 }}
                        zoomDomain={{ x: xZoomDomain }}
                    />
                }
                maxDomain={{ x: now }}
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
                        size={2.5}
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
                    tickFormat={(t) => DateTime.fromMillis(t).toFormat("LLL d")}
                    fixLabelOverlap
                    style={{
                        grid: { stroke: "none" },
                        tickLabels: { padding: 16, angle: -45 },
                    }}
                    axisComponent={<CustomLineSegment dx1={20} />}
                    tickComponent={<CustomLineSegment xcutoff={70} />}
                    tickLabelComponent={<CustomVictoryLabel xcutoff={70} dx1={-12} />}
                />

                {/* Category axis (y) */}
                <VictoryAxis
                    crossAxis
                    dependentAxis
                    tickValues={[0, 1, 2, 3, 4, 5]}
                    tickFormat={(t) => labels[t]}
                    style={{
                        grid: { stroke: "grey" },
                        tickLabels: { fontSize: "12px", padding: 4 },
                    }}
                    offsetX={70}
                    gridComponent={<CustomLineSegment dx1={20} />}
                    tickLabelComponent={<CustomVictoryLabel dy1={-23} />}
                />
            </VictoryChart>
            <VictoryLegend
                orientation="horizontal"
                x={80}
                gutter={25}
                height={50}
                data={lines.map((line) => {
                    return {
                        name: keyMap[line.y],
                        symbol: { fill: line.color },
                    };
                })}
            />
        </>
    );
};

export default DASSGraph;
