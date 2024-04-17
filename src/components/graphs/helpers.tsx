import { Fragment } from "react";
import { AnyMap } from "../../helpers";
import { Chart } from "chart.js";
import { clamp } from "lodash";

export interface GraphProps {
    data: any[];
    sync: boolean;
}

export interface LineData {
    name: string;
    color: string;
}

export const ONE_DAY = 86400 * 1000;
export const ONE_MINUTE = 60 * 1000;

interface GraphHeaderProps {
    lineData: LineData[];
    leftLimit: number;
    rightLimit: number;
    dataRange: number;
    id: number | undefined;
    sync: boolean;
}

export const GraphHeader = ({ dataRange, lineData, leftLimit, rightLimit, id, sync }: GraphHeaderProps) => {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
        }}>
            <div style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
            }}>
                {lineData.map((line) => (
                    <Fragment key={line.name}>
                        <div style={{
                            height: "12px",
                            width: "12px",
                            backgroundColor: line.color,
                            borderRadius: "2px",
                            marginRight: "8px",
                        }}></div>
                        <div style={{
                            marginRight: "12px",
                        }}>{line.name}</div>
                    </Fragment>
                ))}
            </div>
            <div style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
            }}>
                <p>Zoom</p>
                {dataRange > ONE_DAY * 90 && (<div onClick={() => zoomTo("3M", id, leftLimit, rightLimit, sync)} className="outline-button">3M</div>)}
                {dataRange > ONE_DAY * 180 && (<div onClick={() => zoomTo("6M", id, leftLimit, rightLimit, sync)} className="outline-button">6M</div>)}
                {dataRange > ONE_DAY * 365 && (<div onClick={() => zoomTo("1Y", id, leftLimit, rightLimit, sync)} className="outline-button">1Y</div>)}
                <div onClick={() => zoomTo("All", id, leftLimit, rightLimit, sync)} className="outline-button">All</div>
            </div>
        </div>
    );
};

const zoomTo = (key: string, id: number | undefined, leftLimit: number, rightLimit: number, sync: boolean) => {
    if (id === undefined) return;
    const chart = Chart.instances[id];
    const lateTime = chart.scales.x.max;

    const minMap: AnyMap = {
        "3M": lateTime - ONE_DAY * 90,
        "6M": lateTime - ONE_DAY * 180,
        "1Y": lateTime - ONE_DAY * 365,
    };

    let minMax = undefined;

    if (key === "All") {
        minMax = { min: leftLimit, max: rightLimit };
    } else {
        let minimum = minMap[key];
        let maximum = lateTime;

        if (minimum < leftLimit) {
            const diff = leftLimit - minimum;
            minimum += diff;
            maximum += diff;
        }

        minMax = { min: minimum, max: maximum };
    }

    if (sync) {
        for (let instance of Object.values(Chart.instances)) {
            instance.zoomScale("x", minMax, "active");
            requestAnimationFrame(() => {
                chooseTicks(instance, leftLimit, rightLimit);
            });
        }
    } else {
        chart.zoomScale("x", minMax, "active");
        chooseTicks(chart, leftLimit, rightLimit);
    }
};

export const chooseTicks = (chart: Chart, originalMin: number, originalMax: number) => {
    if (!chart.options.scales?.x || !chart.scales?.x) return;
    const updatedMax = chart.scales.x.max;
    const updatedMin = chart.scales.x.min;
    const updatedRange = updatedMax - updatedMin;
    const numGridlines = Math.floor(clamp(chart.chartArea.width * (0.014), 4, 15));
    const minInterval = updatedRange / numGridlines;
    let interval = 0;
    while (interval < minInterval) {
        interval += ONE_DAY;
    }
    let i = originalMin - interval * 10;
    const ticks: number[] = [];
    while (i <= originalMax + interval * 10) {
        ticks.push(i);
        i += interval;
    }
    chart.options.scales.x.afterBuildTicks = (scale) => {
        if (scale.ticks) {
            scale.ticks = ticks
            .filter(
                (v) =>
                v > chart.scales.x.min && v < chart.scales.x.max
            )
            .map((v) => ({ value: v }));
        }
    }

    chart.pan({
        x: 1
    });
}

export const initialZoom = (chart: Chart, startMinimum: number, leftLimit: number, rightLimit: number) => {
    requestAnimationFrame(() => {
        try {
            chart.zoomScale("x", { min: startMinimum, max: rightLimit }, "active");
            chooseTicks(chart, leftLimit, rightLimit);
        } catch (e) {
            console.log(e);
            console.warn("zoomScale failed");
        }
    });
}

interface GraphEvent {
    chart: Chart;
}

const syncRange = function (e: GraphEvent) {
    const xScale = e.chart.scales.x;
    const zoom = { min: xScale.min, max: xScale.max };
    for (let instance of Object.values(Chart.instances)) {
        if (instance.id === e.chart.id) continue;
        instance.zoomScale("x", zoom);
    }
};

export const getCSSVar = (name: string) => {
    return getComputedStyle(document.body).getPropertyValue(name);
};

export const GRAPH_BASE_OPTIONS = () => {
    Chart.defaults.font.size = 14;
    Chart.defaults.font.family = "'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
    return {
        elements: {
            line: {
                tension: 0.15
            }
        },
        normalized: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: "x",
                },
                pan: {
                    enabled: true,
                    mode: "x",
                },
            },
        },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: "day",
                },
                grid: {
                    color: getCSSVar("--graph-grid-color")
                },
                ticks: {
                    minRotation: 30,
                    maxRotation: 30,
                    maxTicksLimit: 16,
                }
            },
            y: {
                grid: {
                    color: getCSSVar("--graph-grid-color")
                }
            },
        },
    };
};

export const GRAPH_SYNC_CHART = {
    plugins: {
        zoom: {
            zoom: {
                onZoom: syncRange,
            },
            pan: {
                onPan: syncRange,
            },
        },
    },
};

export const GRAPH_NO_POINTS = {
    elements: {
        point: {
            pointStyle: false,
        },
    }
};

export const GRAPH_POINTS = {
    elements: {
        point: {
            pointStyle: true,
        },
    }
}

export const GRAPH_TICK_HANDLER = (leftLimit: number, rightLimit: number) => {
    return {
        onResize: (chart: Chart, _: any) => {
            chooseTicks(chart, leftLimit, rightLimit);
        },
        plugins: {
            zoom: {
                zoom: {
                    onZoom: ({ chart }: { chart: Chart }) => {
                        chooseTicks(chart, leftLimit, rightLimit);
                    }
                }
            }
        }
    }
}
