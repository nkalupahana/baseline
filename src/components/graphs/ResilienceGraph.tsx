import { VictoryScatter, VictoryChart, VictoryAxis, VictoryZoomContainer } from "victory";
import { BlockerRectangle, CustomLineSegment, GraphProps, GraphHeader, VictoryDateAxis, DefaultLine, CustomVictoryLabel } from "./helpers";
import theme from "./graph-theme";
import { AnyMap, COLORS } from "../../helpers";
import { useMemo } from "react";
import useZoomRange from "./useZoomRange";

const ResilienceGraph = ({ xZoomDomain, setXZoomDomain, data, now, pageWidth, tickCount, tickFormatter, zoomTo }: GraphProps) => {
    const [dataRange, minimumZoom, maxDomain] = useZoomRange(now, data, setXZoomDomain);
    const lines: AnyMap[] = [
        {
            y: "value",
            color: COLORS[-3],
        }
    ];

    const keyMap: AnyMap = {
        value: "Resilience Score"
    };

    const labels = useMemo(() => {
        return ["Low", "Medium", "High"];
    }, []);

    return (
        <div>
            <GraphHeader lines={lines} keyMap={keyMap} zoomTo={zoomTo} dataRange={dataRange} />
            
            <VictoryChart
                theme={theme}
                containerComponent={<VictoryZoomContainer
                    zoomDimension="x"
                    onZoomDomainChange={(domain) => setXZoomDomain(domain.x as [number, number])}
                    minimumZoom={{ x: minimumZoom }}
                    zoomDomain={{ x: xZoomDomain }}
                />}
                maxDomain={{ x: maxDomain }}
                width={pageWidth}
            >
                {/* Lines */}
                {lines.map(line => <DefaultLine data={data} line={line} key={line.y} days={60} />)}

                {/* Points on line */}
                {lines.map((line) => (
                    <VictoryScatter
                        key={line.y}
                        data={data}
                        x="timestamp"
                        y={line.y}
                        style={{
                            data: { fill: line.color },
                        }}
                    />
                ))}

                <BlockerRectangle />
                <VictoryDateAxis data={data} tickFormatter={tickFormatter} tickCount={tickCount} />

                {/* Category axis (y) */}
                <VictoryAxis
                    crossAxis
                    dependentAxis
                    tickValues={[0, 1, 2, 3]}
                    tickFormat={(t) => labels[t]}
                    style={{
                        grid: { stroke: "grey" },
                        tickLabels: { padding: 4 },
                    }}
                    offsetX={80}
                    gridComponent={<CustomLineSegment dx1={30} />}
                    tickLabelComponent={<CustomVictoryLabel dy1={-50} />}
                />
            </VictoryChart>
        </div>
    );
};

export default ResilienceGraph;
