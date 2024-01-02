import { GRAPH_BASE_OPTIONS, GRAPH_NO_POINTS, GRAPH_SYNC_CHART, GraphProps, LineData, initialZoom } from "./helpers";
import { COLORS } from "../../helpers";
import useGraphConfig from "./useGraphConfig";
import { useEffect, useMemo } from "react";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import { merge } from "lodash";
import InnerGraph from "./InnerGraph";

const BaselineGraph = ({ data, sync }: GraphProps) => {
    const { id, setId, dataRange, minimumZoom, yRange, startMinimum, minimumValue, canvas, now } = useGraphConfig(data);

    const lineData: LineData[] = useMemo(() => {
        return [{
            name: "baseline score",
            color: COLORS[0],
        }];
    }, []);

    const options = useMemo(() => {
        return merge(GRAPH_BASE_OPTIONS(), sync ? GRAPH_SYNC_CHART : {}, GRAPH_NO_POINTS, {
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
            }
        }) as any;
    }, [data, minimumZoom, now, yRange, sync]);

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
        
        initialZoom(chart, startMinimum, now);
        setId(Number(chart.id));

        return () => {
            chart.destroy();
        };
    }, [data, lineData, options, setId, startMinimum, now, canvas]);

    return <InnerGraph lineData={lineData} dataRange={dataRange} id={id} minimumValue={minimumValue} canvas={canvas} />
};

export default BaselineGraph;
