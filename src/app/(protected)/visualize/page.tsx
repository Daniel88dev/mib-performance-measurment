"use client";

import { useState } from "react";
import { ChartFilters } from "@/components/metrics/chart-filters";
import { MetricsChart } from "@/components/metrics/metrics-chart";

export default function VisualizePage() {
  // Default to last month
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [filters, setFilters] = useState<{
    accountId: string | null;
    types: string[];
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({
    accountId: null,
    types: [],
    startDate: oneMonthAgo,
    endDate: today,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visualize Performance</h1>
        <p className="text-muted-foreground">
          Create interactive charts to analyze performance trends
        </p>
      </div>

      <MetricsChart filters={filters} />

      <ChartFilters onFiltersChange={setFilters} />
    </div>
  );
}
