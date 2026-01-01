import { z } from "zod";

/**
 * CSV row schema - validates individual CSV rows
 */
export const csvRowSchema = z.object({
  Date: z.string(),
  Host: z.string().optional(),
  Service: z.string().optional(),
  '@data.duration': z.string().transform((val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      throw new Error(`Invalid duration value: ${val}`);
    }
    return parsed;
  }),
  accountId: z.string().min(1, "Account ID is required"),
  '@data.type': z.string().min(1, "Measurement type is required"),
  Content: z.string().optional(),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

/**
 * Aggregated metric schema
 */
export const aggregatedMetricSchema = z.object({
  bucketTimestamp: z.date(),
  accountId: z.string(),
  type: z.string(),
  avgDuration: z.number(),
  recordCount: z.number(),
});

export type AggregatedMetric = z.infer<typeof aggregatedMetricSchema>;

/**
 * Metrics filter schema for API requests
 */
export const metricsFilterSchema = z.object({
  accountIds: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100).optional(),
  offset: z.number().min(0).default(0).optional(),
});

export type MetricsFilter = z.infer<typeof metricsFilterSchema>;
