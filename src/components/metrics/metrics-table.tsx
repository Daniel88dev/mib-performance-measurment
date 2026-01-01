"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBucketTimestamp } from "@/lib/time-bucket";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Metric {
  id: string;
  bucketTimestamp: string;
  accountId: string;
  type: string;
  avgDuration: string;
  recordCount: number;
}

interface MetricsTableProps {
  filters?: {
    accountIds?: string[];
    types?: string[];
    startDate?: string;
    endDate?: string;
  };
}

export function MetricsTable({ filters }: MetricsTableProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const fetchMetrics = async (offset: number = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });

      if (filters?.accountIds && filters.accountIds.length > 0) {
        params.set("accountIds", filters.accountIds.join(","));
      }
      if (filters?.types && filters.types.length > 0) {
        params.set("types", filters.types.join(","));
      }
      if (filters?.startDate) {
        params.set("startDate", filters.startDate);
      }
      if (filters?.endDate) {
        params.set("endDate", filters.endDate);
      }

      const response = await fetch(`/api/metrics?${params}`);
      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePreviousPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    fetchMetrics(newOffset);
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      fetchMetrics(pagination.offset + pagination.limit);
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No metrics found. Try uploading some CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp (UTC)</TableHead>
              <TableHead>Account ID</TableHead>
              <TableHead>Measurement Type</TableHead>
              <TableHead className="text-right">Avg Duration (ms)</TableHead>
              <TableHead className="text-right">Record Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell className="font-mono text-sm">
                  {formatBucketTimestamp(new Date(metric.bucketTimestamp))}
                </TableCell>
                <TableCell className="font-mono">{metric.accountId}</TableCell>
                <TableCell>{metric.type}</TableCell>
                <TableCell className="text-right font-mono">
                  {parseFloat(metric.avgDuration).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{metric.recordCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {pagination.offset + 1} to {pagination.offset + metrics.length} of{" "}
          {pagination.total} entries
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={pagination.offset === 0 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!pagination.hasMore || loading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
