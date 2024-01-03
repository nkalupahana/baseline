import { GRAPH_BASE_OPTIONS, GRAPH_POINTS, GRAPH_SYNC_CHART, GraphProps, LineData, initialZoom } from "./helpers";
import { AnyMap, COLORS } from "../../helpers";
import useGraphConfig from "./useGraphConfig";
import { useEffect, useMemo } from "react";
import { Chart } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import { merge } from "lodash";
import InnerGraph from "./InnerGraph";

const LABEL_MAP: AnyMap = {
    0.5: "Low",
    1.5: "Medium",
    2.5: "High",
};

const ResilienceGraph = ({ data, sync }: GraphProps) => {
    const { id, setId, dataRange, minimumZoom, startMinimum, canvas, leftLimit, rightLimit } = useGraphConfig(data);

    const lineData: LineData[] = useMemo(() => {
        return [{
            name: "Resilience Score",
            color: COLORS[-3],
        }];
    }, []);

    const options = useMemo(() => {
        return merge(GRAPH_BASE_OPTIONS(), sync ? GRAPH_SYNC_CHART : {}, GRAPH_POINTS, {
            parsing: {
                xAxisKey: "timestamp",
                yAxisKey: "value",
            },
            plugins: {
                zoom: {
                    limits: {
                        x: {
                            min: leftLimit,
                            max: rightLimit,
                            minRange: minimumZoom,
                        },
                    },
                },
            },
            scales: {
                y: {
                    min: 0,
                    max: 3,
                    grid: {
                        color: function (context: any) {
                            if ([0, 1, 2, 3].includes(context.tick.value)) {
                                return "#bdbdbd"; // TODO: light/dark mode -- extract to helper
                            } else {
                                return "rgba(0, 0, 0, 0)";
                            }
                        },
                    },
                    ticks: {
                        callback: function (value: number) {
                            return LABEL_MAP[value] ?? "";
                        },
                        stepSize: 0.5
                    },
                }
            },
        }) as any;
    }, [minimumZoom, leftLimit, rightLimit, sync]);

    useEffect(() => {
        if (!canvas.current) return;
        Chart.register(zoomPlugin);
        const chart = new Chart(canvas.current, {
            type: "line",
            data: {
                datasets: [{ data, borderColor: lineData[0].color, pointBackgroundColor: lineData[0].color }],
            },
            options
        });
        
        initialZoom(chart, startMinimum, rightLimit);
        setId(Number(chart.id));

        return () => {
            chart.destroy();
        };
    }, [lineData, options, setId, startMinimum, leftLimit, rightLimit, canvas, data]);

    return <InnerGraph lineData={lineData} dataRange={dataRange} id={id} leftLimit={leftLimit} rightLimit={rightLimit} canvas={canvas} />
};

export default ResilienceGraph;
