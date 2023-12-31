import { GRAPH_BASE_OPTIONS, GRAPH_SYNC_CHART, GraphHeader, GraphProps, LineData } from "./helpers";
import { COLORS } from "../../helpers";
import useZoomRange from "./useZoomRange";
import { useEffect, useMemo, useRef } from "react";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import { merge } from "lodash";

const BaselineGraph = ({ data, now, sync }: GraphProps) => {
    const { id, setId, dataRange, minimumZoom, yRange, startMinimum, minimumValue } = useZoomRange(now, data);
    const canvas = useRef(null);

    const lineData: LineData[] = useMemo(() => {
        return [{
            name: "baseline score",
            color: COLORS[0],
        }];
    }, []);

    const options = useMemo(() => {
        return merge(GRAPH_BASE_OPTIONS(), sync ? GRAPH_SYNC_CHART : {}, {
            parsing: {
                xAxisKey: "timestamp",
                yAxisKey: "value",
            },
            plugins: {
                zoom: {
                    limits: {
                        x: {
                            min: data[0].timestamp,
                            max: now,
                            minRange: minimumZoom,
                        },
                    },
                },
            },
            scales: {
                y: yRange,
            },
        }) as any;
    }, [data, minimumZoom, now, yRange]);

    useEffect(() => {
        if (!canvas.current) return;
        Chart.register(zoomPlugin);
        const chart = new Chart(canvas.current, {
            type: "line",
            data: {
                datasets: [{ data, borderColor: lineData[0].color }],
            },
            options
        });
        
        requestAnimationFrame(() => {
            try {
                chart.zoomScale("x", { min: startMinimum, max: now }, "none");
            } catch {
                console.log("zoomScale failed");
            }
        });

        setId(Number(chart.id));

        return () => {
            chart.destroy();
        };
    }, [data, lineData, options, setId, startMinimum, now]);

    return (
        <div className="outerGraphContainer">
            <GraphHeader lineData={lineData} dataRange={dataRange} id={id} minimumValue={minimumValue} />
            <div className="innerGraphContainer">
                <canvas ref={canvas} />
            </div>
        </div>
    );
};

export default BaselineGraph;
