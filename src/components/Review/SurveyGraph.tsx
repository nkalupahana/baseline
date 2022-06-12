import { AnyMap } from "../../helpers";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Legend, Line, Label } from "recharts";
import { GraphConfig } from "../../screeners/screener";

interface Props {
    data: AnyMap[],
    graphConfig: GraphConfig;
}

const SurveyGraph = ({ data, graphConfig }: Props) => {
    return <ResponsiveContainer width="100%" height={370}>
            <LineChart
              width={500}
              height={400}
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis width={45}>
                    <Label angle={-90} value={graphConfig.yAxisLabel} position='insideLeft' style={{textAnchor: 'middle'}} dy={"0.4em"} />
                </YAxis>
                <Legend />
                { graphConfig.lines.map(({ key, color }) => <Line key={key} type="monotone" dataKey={key} stroke={color} />) }
            </LineChart>
        </ResponsiveContainer>;
}

export default SurveyGraph;