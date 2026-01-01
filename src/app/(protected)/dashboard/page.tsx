import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload, BarChart3, Table } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your performance measurement dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Data</span>
            </CardTitle>
            <CardDescription>Import CSV performance measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/upload">Go to Upload</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Visualize</span>
            </CardTitle>
            <CardDescription>View performance charts and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/visualize">View Charts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Table className="h-5 w-5" />
              <span>Browse Data</span>
            </CardTitle>
            <CardDescription>Explore aggregated metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/metrics">View Metrics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Quick guide to using the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Upload Performance Data</h3>
            <p className="text-sm text-muted-foreground">
              Upload CSV files containing your website performance measurements. The system will automatically
              aggregate data into 4-hour time buckets.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. View Aggregated Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Browse the metrics table to see your aggregated performance data filtered by account ID,
              measurement type, and time range.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Visualize Trends</h3>
            <p className="text-sm text-muted-foreground">
              Use the visualization page to create interactive charts comparing multiple metrics and
              identifying performance trends over time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
