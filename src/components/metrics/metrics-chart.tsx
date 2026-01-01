"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatChartDate } from "@/lib/time-bucket";

interface Metric {
  bucketTimestamp: string;
  accountId: string;
  type: string;
  avgDuration: string;
  recordCount: number;
}

interface ChartDataPoint {
  date: string;
  fullTimestamp: string;
  timestampSort: number;
  [key: string]: string | number;
}

interface MetricsChartProps {
  filters: {
    accountId: string | null;
    types: string[];
    startDate: Date | undefined;
    endDate: Date | undefined;
  };
}

const CHART_COLORS = [
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#10b981", // Green
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#14b8a6", // Teal
  "#6366f1", // Indigo
];

export function MetricsChart({ filters }: MetricsChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // Only add accountId filter if one is selected
        if (filters.accountId) {
          params.set("accountIds", filters.accountId);
        }

        // Only add types filter if some are selected
        if (filters.types.length > 0) {
          params.set("types", filters.types.join(","));
        }

        // Add date filters if set
        if (filters.startDate) {
          params.set("startDate", filters.startDate.toISOString());
        }
        if (filters.endDate) {
          // Set end date to end of day
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.set("endDate", endOfDay.toISOString());
        }

        // Don't set a limit - we want all data for the chart
        params.set("noLimit", "true");

        const response = await fetch(`/api/metrics?${params}`);
        const data = await response.json();

        if (data.success && data.data) {
          const metrics: Metric[] = data.data;

          // Group data by timestamp and type
          // If accountId is null, calculate average across all accounts
          // If types is empty, show all types
          const groupedData = new Map<string, Map<string, { sum: number; count: number }>>();
          const allTypes = new Set<string>();

          metrics.forEach((metric) => {
            const timestamp = new Date(metric.bucketTimestamp);
            const timestampKey = timestamp.toISOString();
            const type = metric.type;

            allTypes.add(type);

            if (!groupedData.has(timestampKey)) {
              groupedData.set(timestampKey, new Map());
            }

            const typeData = groupedData.get(timestampKey)!;
            if (!typeData.has(type)) {
              typeData.set(type, { sum: 0, count: 0 });
            }

            const current = typeData.get(type)!;
            current.sum += parseFloat(metric.avgDuration);
            current.count += 1;
          });

          // Convert to chart data format
          const chartDataPoints: ChartDataPoint[] = Array.from(groupedData.entries())
            .map(([timestampKey, typeMap]) => {
              const timestamp = new Date(timestampKey);

              const dataPoint: ChartDataPoint = {
                date: formatChartDate(timestamp),
                fullTimestamp: timestampKey,
                timestampSort: timestamp.getTime(),
              };

              let totalSum = 0;

              // Calculate average for each type
              typeMap.forEach((data, type) => {
                const avg = data.sum / data.count;
                dataPoint[type] = Math.round(avg * 100) / 100;
                totalSum += avg;
              });

              // Calculate overall sum across all types
              if (totalSum > 0) {
                dataPoint["Total"] = Math.round(totalSum * 100) / 100;
              }

              return dataPoint;
            })
            .sort((a, b) => a.timestampSort - b.timestampSort);

          // Set series keys (all types + Total)
          const types = Array.from(allTypes).sort();
          setSeriesKeys([...types, "Total"]);
          setChartData(chartDataPoints);
        }
      } catch (error) {
        console.error("Failed to fetch chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
          <CardDescription>
            Performance trends over time grouped by measurement type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px] border rounded-lg">
            <p className="text-muted-foreground">
              No data available. Upload CSV files to see performance metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accountText = filters.accountId
    ? `Account: ${filters.accountId}`
    : "All Accounts (Average)";

  const typeText = filters.types.length > 0
    ? `${filters.types.length} selected type${filters.types.length > 1 ? 's' : ''}`
    : "All Types";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Timeline</CardTitle>
        <CardDescription>
          {accountText} • {typeText} • {seriesKeys.length} series across {chartData.length} time points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestampSort"
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return formatChartDate(date);
              }}
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis
              label={{ value: "Avg Duration (ms)", angle: -90, position: "insideLeft" }}
              className="text-xs"
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(Number(value));
                const dateStr = formatChartDate(date);
                const hour = date.getUTCHours();
                return `${dateStr} ${String(hour).padStart(2, '0')}:00 UTC`;
              }}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#000000" }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {seriesKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={key === "Total" ? "#dc2626" : CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={key === "Total" ? 3 : 2}
                strokeDasharray={key === "Total" ? "5 5" : undefined}
                dot={{ r: 4, fill: key === "Total" ? "#dc2626" : CHART_COLORS[index % CHART_COLORS.length] }}
                activeDot={{ r: 6 }}
                connectNulls={true}
                name={key}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
