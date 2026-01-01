/**
 * Buckets a timestamp into 4-hour UTC windows
 * Buckets: 00:00-04:00, 04:00-08:00, 08:00-12:00, 12:00-16:00, 16:00-20:00, 20:00-24:00
 */
export function getBucketTimestamp(dateString: string): Date {
  const date = new Date(dateString);

  // Get UTC hours
  const hours = date.getUTCHours();

  // Calculate bucket hour (0, 4, 8, 12, 16, or 20)
  const bucketHour = Math.floor(hours / 4) * 4;

  // Create new date with bucket hour and zero minutes/seconds/milliseconds
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    bucketHour,
    0,
    0,
    0
  ));
}

/**
 * Format a bucket timestamp for display
 */
export function formatBucketTimestamp(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:00 UTC`;
}

/**
 * Format a bucket timestamp for chart display (day only)
 */
export function formatChartDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
