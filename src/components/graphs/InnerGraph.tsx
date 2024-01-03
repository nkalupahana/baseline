import { Ref } from "react";
import { GraphHeader, LineData } from "./helpers"

interface InnerGraphProps {
    lineData: LineData[];
    dataRange: number;
    id: number | undefined;
    leftLimit: number;
    rightLimit: number;
    canvas: Ref<HTMLCanvasElement>;
}

const InnerGraph = ({ lineData, dataRange, id, leftLimit, rightLimit, canvas } : InnerGraphProps) => {
    return <div className="outerGraphContainer">
        <GraphHeader lineData={lineData} dataRange={dataRange} id={id} leftLimit={leftLimit} rightLimit={rightLimit} />
        <div className="innerGraphContainer">
            <canvas ref={canvas} />
        </div>
    </div>
}

export default InnerGraph;