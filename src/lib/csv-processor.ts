import Papa from "papaparse";
import { csvRowSchema } from "@/lib/validations";
import { getBucketTimestamp } from "@/lib/time-bucket";
import type { ProcessedCsvResult, CsvValidationError } from "@/types/csv";

const MIN_DURATION = 0;
const MAX_DURATION = 25000;

/**
 * Process CSV file and aggregate performance measurements
 */
export async function processCsvFile(file: File): Promise<ProcessedCsvResult> {
  // Read file contents as text (works in Node.js environment)
  const csvText = await file.text();

  return new Promise((resolve) => {
    const errors: CsvValidationError[] = [];
    const validRows: Array<{ timestamp: Date; accountId: string; type: string; duration: number }> = [];

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate and filter rows
        results.data.forEach((row, index) => {
          try {
            // Validate row schema
            const parsed = csvRowSchema.parse(row);

            // Filter by duration (> 0 and < 25000)
            const duration = parsed['@data.duration'];
            if (duration <= MIN_DURATION || duration >= MAX_DURATION) {
              // Skip this row (filtered out)
              return;
            }

            // Add to valid rows
            validRows.push({
              timestamp: new Date(parsed.Date),
              accountId: parsed.accountId,
              type: parsed['@data.type'],
              duration,
            });
          } catch (error) {
            // Record validation error
            if (error instanceof Error) {
              errors.push({
                row: index + 2, // +2 because index is 0-based and we have a header row
                field: 'unknown',
                message: error.message,
              });
            }
          }
        });

        // If too many errors, return early
        if (errors.length > 100) {
          resolve({
            success: false,
            errors: errors.slice(0, 100).map(e => `Row ${e.row}: ${e.message}`),
          });
          return;
        }

        // Aggregate data by bucket, accountId, and type
        const aggregated = aggregateData(validRows);

        resolve({
          success: true,
          aggregatedData: aggregated,
          errors: errors.map(e => `Row ${e.row}: ${e.message}`),
          stats: {
            totalRows: results.data.length,
            validRows: validRows.length,
            filteredRows: results.data.length - validRows.length - errors.length,
            aggregatedGroups: aggregated.length,
          },
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          errors: [`Failed to parse CSV: ${error.message}`],
        });
      },
    });
  });
}

/**
 * Aggregate data by 4-hour bucket, accountId, and type
 */
function aggregateData(
  rows: Array<{ timestamp: Date; accountId: string; type: string; duration: number }>
) {
  // Group by bucket + accountId + type
  const groups = new Map<string, { durations: number[]; count: number }>();

  rows.forEach((row) => {
    // Calculate bucket timestamp
    const bucket = getBucketTimestamp(row.timestamp.toISOString());
    const key = `${bucket.toISOString()}|${row.accountId}|${row.type}`;

    if (!groups.has(key)) {
      groups.set(key, { durations: [], count: 0 });
    }

    const group = groups.get(key)!;
    group.durations.push(row.duration);
    group.count++;
  });

  // Calculate averages and convert to result format
  const results = Array.from(groups.entries()).map(([key, data]) => {
    const [bucketStr, accountId, type] = key.split('|');
    const avgDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.count;

    return {
      bucketTimestamp: new Date(bucketStr),
      accountId,
      type,
      avgDuration: Math.round(avgDuration * 100) / 100, // Round to 2 decimal places
      recordCount: data.count,
    };
  });

  return results;
}
