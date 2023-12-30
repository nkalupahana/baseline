import { GraphProps } from "./helpers";
import useGraphConfig from "./useGraphConfig";

interface IsolatedGraphProps {
    graph: (props: GraphProps) => JSX.Element
    data: any[]
}

const IsolatedGraph = (props: IsolatedGraphProps) => {
    const { now, xZoomDomain, setXZoomDomain, zoomTo, pageWidthRef, pageWidth, tickCount, memoTickFormatter } = useGraphConfig();

    return <div ref={pageWidthRef}>
        <props.graph 
            data={props.data}
            xZoomDomain={xZoomDomain}
            setXZoomDomain={setXZoomDomain}
            now={now}
            pageWidth={pageWidth}
            tickCount={tickCount}
            tickFormatter={memoTickFormatter}
            zoomTo={zoomTo}
        />
    </div>
}

export default IsolatedGraph;