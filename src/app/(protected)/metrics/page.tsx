import { MetricsTable } from "@/components/metrics/metrics-table";

export default function MetricsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Metrics</h1>
        <p className="text-muted-foreground">
          Browse aggregated performance data from your uploads
        </p>
      </div>

      <MetricsTable />
    </div>
  );
}
