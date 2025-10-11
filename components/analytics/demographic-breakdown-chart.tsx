"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DemographicVoteBreakdown } from "@/db/queries/demographic-analytics-queries";

interface DemographicBreakdownChartProps {
  data: DemographicVoteBreakdown[];
  title: string;
  description?: string;
  chartType?: "stacked" | "grouped";
  showPercentages?: boolean;
}

export function DemographicBreakdownChart({
  data,
  title,
  description,
  chartType = "stacked",
  showPercentages = true,
}: DemographicBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg" dir="rtl">{title}</CardTitle>
          {description && <CardDescription dir="rtl">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500" dir="rtl">
            אין מספיק נתונים להצגת גרף זה
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts
  const chartData = data.map(item => ({
    category: item.categoryLabel,
    לשמור: showPercentages ? item.agreePercent : item.agreeCount,
    לזרוק: showPercentages ? item.disagreePercent : item.disagreeCount,
    לדלג: showPercentages ? item.neutralPercent : item.neutralCount,
    totalVotes: item.totalVotes,
  }));

  const colors = {
    לשמור: "#10b981", // emerald-500
    לזרוק: "#f43f5e", // rose-500
    לדלג: "#9ca3af", // gray-400
  };

  // Custom tooltip
  interface TooltipPayload {
    category: string;
    לשמור: number;
    לזרוק: number;
    לדלג: number;
    totalVotes: number;
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipPayload }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200" dir="rtl">
          <p className="font-semibold text-gray-900 mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            <p className="text-emerald-600">
              לשמור: {data.לשמור}{showPercentages ? "%" : ""}
            </p>
            <p className="text-rose-600">
              לזרוק: {data.לזרוק}{showPercentages ? "%" : ""}
            </p>
            <p className="text-gray-600">
              לדלג: {data.לדלג}{showPercentages ? "%" : ""}
            </p>
            <p className="text-gray-500 text-xs pt-1 border-t mt-2">
              סה״כ: {data.totalVotes} בחירות
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg" dir="rtl">{title}</CardTitle>
        {description && <CardDescription dir="rtl">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              style={{ fontSize: "12px" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              style={{ fontSize: "12px" }}
              label={{
                value: showPercentages ? "אחוז (%)" : "מספר בחירות",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
            <Bar
              dataKey="לשמור"
              stackId={chartType === "stacked" ? "stack" : undefined}
              fill={colors.לשמור}
              radius={chartType === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
            <Bar
              dataKey="לזרוק"
              stackId={chartType === "stacked" ? "stack" : undefined}
              fill={colors.לזרוק}
              radius={chartType === "stacked" ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
            <Bar
              dataKey="לדלג"
              stackId={chartType === "stacked" ? "stack" : undefined}
              fill={colors.לדלג}
              radius={chartType === "stacked" ? [4, 4, 0, 0] : [4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
