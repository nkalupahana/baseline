import { AnyMap } from "../../helpers";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Line,
  Label,
} from "recharts";
import { GraphConfig } from "../../screeners/screener";
import {
  IonButton,
  IonContent,
  IonTab,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from "@ionic/react";

interface Props {
  data: AnyMap[];
  graphConfig: GraphConfig;
}

const SurveyGraph = ({ data, graphConfig }: Props) => {
  return (
    <>
      <ResponsiveContainer width="100%" height={370}>
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
          <YAxis
            tickFormatter={(v, i) => {
              return String(v).substring(0, 4);
            }}
            width={graphConfig.yAxisWidth ?? 45}
            domain={graphConfig.yDomain}
          >
            <Label
              className={"svg-text-color"}
              angle={-90}
              value={graphConfig.yAxisLabel}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              dy={"0.1em"}
            />
          </YAxis>
          <Legend />
          {graphConfig.lines.map(({ key, color }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default SurveyGraph;
