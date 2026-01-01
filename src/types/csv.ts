export interface ProcessedCsvResult {
  success: boolean;
  aggregatedData?: Array<{
    bucketTimestamp: Date;
    accountId: string;
    type: string;
    avgDuration: number;
    recordCount: number;
  }>;
  errors?: string[];
  stats?: {
    totalRows: number;
    validRows: number;
    filteredRows: number;
    aggregatedGroups: number;
  };
}

export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
}
