import { assign } from "lodash";
import { VictoryThemeDefinition } from "victory";

// *
// * Colors
// *
const colors: string[] = [];
const blueGrey50 = "#ECEFF1";
const blueGrey300 = "#90A4AE";
const blueGrey700 = "#455A64";

// *
// * Typography
// *

const sansSerif = "'Lato', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
const letterSpacing = "normal";
const fontSize = 16;
// *
// * Layout
// *
const padding = 8;
const baseProps = {
    width: 350,
    height: 400,
    padding: 50,
};
// *
// * Labels
// *
const baseLabelStyles = {
    fontFamily: sansSerif,
    fontSize,
    letterSpacing,
    padding,
    fill: blueGrey700,
    stroke: "transparent",
    strokeWidth: 0,
};

const centeredLabelStyles = assign({ textAnchor: "middle" }, baseLabelStyles);
// *
// * Strokes
// *
const strokeDasharray = "10, 5";
const strokeLinecap = "round";
const strokeLinejoin = "round";

const theme: VictoryThemeDefinition = {
    axis: assign(
        {
            style: {
                axis: {
                    fill: "transparent",
                    stroke: blueGrey300,
                    strokeWidth: 2,
                    strokeLinecap,
                    strokeLinejoin,
                },
                axisLabel: assign({}, centeredLabelStyles, {
                    padding,
                    stroke: "transparent",
                }),
                grid: {
                    fill: "none",
                    stroke: blueGrey50,
                    strokeDasharray,
                    strokeLinecap,
                    strokeLinejoin,
                    pointerEvents: "painted",
                },
                ticks: {
                    fill: "transparent",
                    size: 5,
                    stroke: blueGrey300,
                    strokeWidth: 1,
                    strokeLinecap,
                    strokeLinejoin,
                },
                tickLabels: assign({}, baseLabelStyles, {
                    fill: blueGrey700,
                }),
            },
        },
        baseProps
    ),
    chart: assign(
        baseProps,
        {
            padding: {top: 20, bottom: 75, left: 50, right: 25},
            domainPadding: { x: 25, y: 0 }
        }
    ),
    group: assign(
        {
            colorScale: colors,
        },
        baseProps
    ),
    legend: {
        colorScale: colors,
        gutter: 10,
        orientation: "vertical",
        titleOrientation: "top",
        style: {
            data: {
                type: "circle",
            },
            labels: baseLabelStyles,
            title: assign({}, baseLabelStyles, { padding: 5 }),
        },
    },
    line: assign(
        {
            style: {
                data: {
                    fill: "transparent",
                    opacity: 1,
                    stroke: blueGrey700,
                    strokeWidth: 2,
                },
                labels: baseLabelStyles,
            },
        },
        baseProps
    ),
    scatter: assign(
        {
            style: {
                data: {
                    fill: blueGrey700,
                    opacity: 1,
                    stroke: "transparent",
                    strokeWidth: 0,
                },
                labels: baseLabelStyles,
            },
            size: 3
        },
        baseProps
    )
};

export default theme;