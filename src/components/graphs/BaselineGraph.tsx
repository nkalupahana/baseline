import { VictoryScatter, VictoryChart, VictoryAxis, VictoryZoomContainer } from "victory";
import { BlockerRectangle, CustomLineSegment, GraphProps, GraphHeader, VictoryDateAxis, DefaultLine } from "./helpers";
import theme from "./graph-theme";
import { AnyMap, COLORS } from "../../helpers";
import useZoomRange from "./useZoomRange";
import { useMemo } from "react";
import { min, max } from "lodash";

const BaselineGraph = ({ xZoomDomain, setXZoomDomain, data, now, pageWidth, tickCount, tickFormatter, zoomTo }: GraphProps) => {
    const [dataRange, minimumZoom, maxDomain] = useZoomRange(now, data, setXZoomDomain);
    const lines: AnyMap[] = [
        {
            y: "value",
            color: COLORS[0],
        }
    ];

    const keyMap: AnyMap = {
        value: "baseline score"
    };

    const yZoomDomain: [number, number] = useMemo(() => {
        let minValue = min(data.map(d => d.value));
        let maxValue = max(data.map(d => d.value));
        
        // Keep axes clean if they're contained within one quadrant
        if (maxValue >= 0) {
            maxValue += 0.5;
        } else {
            maxValue = Math.min(maxValue + 0.5, -0.01);
        }

        if (minValue <= 0) {
            minValue -= 0.5;
        } else {
            minValue = Math.max(minValue - 0.5, 0.01);
        }

        return [minValue, maxValue];
    }, [data]);

    const flippedAxis = useMemo(() => {
        return yZoomDomain[1] < 0;
    }, [yZoomDomain]);

    return (
        <div>
            <GraphHeader lines={lines} keyMap={keyMap} zoomTo={zoomTo} dataRange={dataRange} />
            <VictoryChart
                theme={theme}
                containerComponent={<VictoryZoomContainer
                    zoomDimension="x"
                    onZoomDomainChange={(domain) => setXZoomDomain(domain.x as [number, number])}
                    minimumZoom={{ x: minimumZoom }}
                    zoomDomain={{ x: xZoomDomain, y: yZoomDomain }}
                />}
                maxDomain={{ x: maxDomain }}
                width={pageWidth}
                padding={{top: flippedAxis ? 75 : 25, bottom: flippedAxis ? 25 : 75, left: 50, right: 25}}
            >

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

                {/* Lines */}
                {lines.map(line => <DefaultLine data={data} line={line} key={line.y} />)}

                <BlockerRectangle />
                <VictoryDateAxis data={data} tickFormatter={tickFormatter} tickCount={tickCount} flippedAxis={flippedAxis} />

                {/* Category axis (y) */}
                <VictoryAxis
                    crossAxis
                    dependentAxis
                    style={{
                        grid: { stroke: "grey" },
                        tickLabels: { padding: 4 },
                    }}
                    offsetX={80}
                    gridComponent={<CustomLineSegment dx1={30} />}
                />
            </VictoryChart>
        </div>
    );
};

export default BaselineGraph;
