import { CsvUpload } from "@/components/upload/csv-upload";

export default function UploadPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Performance Data</h1>
        <p className="text-muted-foreground">
          Import CSV files to analyze your website&apos;s performance metrics
        </p>
      </div>
      <CsvUpload />
    </div>
  );
}
