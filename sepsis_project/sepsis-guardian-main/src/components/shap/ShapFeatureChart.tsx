import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface ShapValue {
  feature: string;
  value: number;
  direction: "positive" | "negative";
  description: string;
  actualValue?: string;
}

interface ShapFeatureChartProps {
  data: ShapValue[];
  className?: string;
}

export function ShapFeatureChart({ data, className }: ShapFeatureChartProps) {
  const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className={className}>
      <div className="flex items-center justify-end gap-4 text-sm mb-4">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-danger" />
          Increases Risk
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success" />
          Decreases Risk
        </span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[-0.3, 0.5]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              width={110}
            />
            <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ShapValue;
                  return (
                    <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
                      <p className="font-semibold text-foreground">{data.feature}</p>
                      {data.actualValue && (
                        <p className="text-sm text-muted-foreground">Value: {data.actualValue}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                      <p className={`text-sm font-medium mt-2 ${data.value > 0 ? "text-danger" : "text-success"}`}>
                        Impact: {data.value > 0 ? "+" : ""}{(data.value * 100).toFixed(1)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value > 0 ? "hsl(var(--danger))" : "hsl(var(--success))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface FeatureExplanationListProps {
  data: ShapValue[];
}

export function FeatureExplanationList({ data }: FeatureExplanationListProps) {
  const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="space-y-3">
      {sortedData.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <div
            className={`mt-1 p-2 rounded-lg ${
              item.value > 0 ? "bg-danger/20" : "bg-success/20"
            }`}
          >
            {item.value > 0 ? (
              <TrendingUp className="h-4 w-4 text-danger" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-medium">{item.feature}</h4>
              <span
                className={`text-sm font-semibold ${
                  item.value > 0 ? "text-danger" : "text-success"
                }`}
              >
                {item.value > 0 ? "+" : ""}
                {(item.value * 100).toFixed(1)}%
              </span>
            </div>
            {item.actualValue && (
              <p className="text-sm text-primary mt-0.5">Measured: {item.actualValue}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
