import { Ref } from "react";
import { GraphHeader, LineData } from "./helpers"

interface InnerGraphProps {
    lineData: LineData[];
    dataRange: number;
    id: number | undefined;
    leftLimit: number;
    rightLimit: number;
    canvas: Ref<HTMLCanvasElement>;
    sync: boolean;
}

const InnerGraph = ({ lineData, dataRange, id, leftLimit, rightLimit, canvas, sync } : InnerGraphProps) => {
    return <div className="outerGraphContainer">
        <GraphHeader lineData={lineData} dataRange={dataRange} id={id} leftLimit={leftLimit} rightLimit={rightLimit} sync={sync} />
        <div className="innerGraphContainer">
            <canvas ref={canvas} />
        </div>
    </div>
}

export default InnerGraph;