"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react";

export function CsvUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message?: string;
    stats?: {
      totalRows: number;
      validRows: number;
      filteredRows: number;
      aggregatedGroups: number;
    };
    warnings?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Only CSV files are allowed");
        return;
      }
      if (selectedFile.size > 15 * 1024 * 1024) {
        toast.error("File size must be less than 15MB");
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".csv")) {
        toast.error("Only CSV files are allowed");
        return;
      }
      if (droppedFile.size > 15 * 1024 * 1024) {
        toast.error("File size must be less than 15MB");
        return;
      }
      setFile(droppedFile);
      setUploadResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          stats: data.stats,
          warnings: data.warnings,
        });
        toast.success("CSV uploaded and processed successfully!");
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Failed to upload CSV",
          warnings: data.details,
        });
        toast.error(data.error || "Failed to upload CSV");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: "An unexpected error occurred",
      });
      toast.error("An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Upload Performance Measurements</CardTitle>
        <CardDescription>
          Upload CSV files containing website performance metrics. Data will be
          automatically aggregated into 4-hour time buckets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {file ? (
            <div className="space-y-2">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">Click or drag file to upload</p>
              <p className="text-sm text-muted-foreground">
                CSV files only (max 15MB)
              </p>
            </div>
          )}
        </div>

        {uploadResult && (
          <Alert variant={uploadResult.success ? "default" : "destructive"}>
            {uploadResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p>{uploadResult.message}</p>
                {uploadResult.stats && (
                  <div className="text-sm space-y-1">
                    <p>Total rows: {uploadResult.stats.totalRows}</p>
                    <p>Valid rows: {uploadResult.stats.validRows}</p>
                    <p>Filtered rows: {uploadResult.stats.filteredRows}</p>
                    <p>
                      Aggregated groups: {uploadResult.stats.aggregatedGroups}
                    </p>
                  </div>
                )}
                {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                  <div className="text-sm">
                    <p className="font-medium">Warnings:</p>
                    <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                      {uploadResult.warnings.slice(0, 10).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                      {uploadResult.warnings.length > 10 && (
                        <li>...and {uploadResult.warnings.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>
              Required columns: Date, @data.duration, accountId, @data.type
            </li>
            <li>
              Duration must be greater than 0 and less than 25000 milliseconds
            </li>
            <li>Data will be grouped into 4-hour UTC time buckets</li>
            <li>Duplicates will be merged with weighted averages</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload and Process CSV
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
