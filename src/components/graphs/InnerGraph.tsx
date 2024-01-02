import { Ref } from "react";
import { GraphHeader, LineData } from "./helpers"

interface InnerGraphProps {
    lineData: LineData[];
    dataRange: number;
    id: number | undefined;
    minimumValue: number;
    canvas: Ref<HTMLCanvasElement>;
}

const InnerGraph = ({ lineData, dataRange, id, minimumValue, canvas } : InnerGraphProps) => {
    return <div className="outerGraphContainer">
        <GraphHeader lineData={lineData} dataRange={dataRange} id={id} minimumValue={minimumValue} />
        <div className="innerGraphContainer">
            <canvas ref={canvas} />
        </div>
    </div>
}

export default InnerGraph;