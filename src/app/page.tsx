import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Upload, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Performance Measurement Dashboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload, analyze, and visualize website performance metrics with powerful insights and real-time data aggregation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="flex flex-col items-center space-y-2 p-6 border rounded-lg">
            <Upload className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Upload CSV Files</h3>
            <p className="text-sm text-muted-foreground text-center">
              Import performance measurements and automatically aggregate data
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-6 border rounded-lg">
            <BarChart3 className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Visualize Metrics</h3>
            <p className="text-sm text-muted-foreground text-center">
              Interactive charts with multi-line comparison and filtering
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-6 border rounded-lg">
            <TrendingUp className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Track Performance</h3>
            <p className="text-sm text-muted-foreground text-center">
              Monitor trends and analyze performance over time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
