import { DateTime } from "luxon";
import { Fragment } from "react";
import { AnyMap } from "../../helpers";
import { Chart } from "chart.js";

export interface GraphProps {
    data: any[];
    sync: boolean;
}

export interface LineData {
    name: string;
    color: string;
}

export const ONE_DAY = 86400 * 1000;

interface GraphHeaderProps {
    lineData: LineData[];
    minimumValue: number;
    dataRange: number;
    id: number | undefined;
}

export const GraphHeader = ({ dataRange, lineData, minimumValue, id }: GraphHeaderProps) => {
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
                {dataRange > ONE_DAY * 90 && (<div onClick={() => zoomTo("3M", id, minimumValue)} className="outline-button">3M</div>)}
                {dataRange > ONE_DAY * 180 && (<div onClick={() => zoomTo("6M", id, minimumValue)} className="outline-button">6M</div>)}
                {dataRange > ONE_DAY * 365 && (<div onClick={() => zoomTo("1Y", id, minimumValue)} className="outline-button">1Y</div>)}
                <div onClick={() => zoomTo("All", id, minimumValue)} className="outline-button">All</div>
            </div>
        </div>
    );
};

const zoomTo = (key: string, id: number | undefined, minimumValue: number) => {
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
        const now = DateTime.now().toMillis();
        minMax = { min: minimumValue, max: now };
    } else {
        let minimum = minMap[key];
        let maximum = lateTime;

        if (minimum < minimumValue) {
            const diff = minimumValue - minimum;
            minimum += diff;
            maximum += diff;
        }

        minMax = { min: minimum, max: maximum };
    }

    for (let instance of Object.values(Chart.instances)) {
        instance.zoomScale("x", minMax, "active");
    }
};

export const initialZoom = (chart: Chart, startMinimum: number, now: number) => {
    requestAnimationFrame(() => {
        try {
            chart.zoomScale("x", { min: startMinimum, max: now }, "none");
        } catch {
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

export const GRAPH_BASE_OPTIONS = () => {
    Chart.defaults.font.size = 14;
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
                    color: getComputedStyle(document.body).getPropertyValue("--graph-grid-color")
                },
                ticks: {
                    maxTicksLimit: 16,
                }
            },
            y: {
                grid: {
                    color: getComputedStyle(document.body).getPropertyValue("--graph-grid-color")
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
