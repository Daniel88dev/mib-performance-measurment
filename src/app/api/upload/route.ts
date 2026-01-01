import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { performanceMetrics } from "@/db/schema";
import { processCsvFile } from "@/lib/csv-processor";
import { eq, and } from "drizzle-orm";

// Configure route segment to allow larger request bodies
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check approval
    const user = await getUser();
    if (!user || !user.isApproved) {
      return NextResponse.json({ error: "User not approved" }, { status: 403 });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 15MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 15MB limit" },
        { status: 400 }
      );
    }

    // Process CSV file
    const result = await processCsvFile(file);

    if (!result.success || !result.aggregatedData) {
      return NextResponse.json(
        {
          error: "Failed to process CSV",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    // Insert or update aggregated data in database
    const insertPromises = result.aggregatedData.map(async (metric) => {
      // Check if record already exists
      const existing = await db.query.performanceMetrics.findFirst({
        where: and(
          eq(performanceMetrics.bucketTimestamp, metric.bucketTimestamp),
          eq(performanceMetrics.accountId, metric.accountId),
          eq(performanceMetrics.type, metric.type)
        ),
      });

      if (existing) {
        // Calculate weighted average
        const totalCount = existing.recordCount + metric.recordCount;
        const existingAvg = parseFloat(existing.avgDuration);
        const newAvg =
          (existingAvg * existing.recordCount +
            metric.avgDuration * metric.recordCount) /
          totalCount;

        // Update existing record
        await db
          .update(performanceMetrics)
          .set({
            avgDuration: newAvg.toFixed(2),
            recordCount: totalCount,
          })
          .where(eq(performanceMetrics.id, existing.id));
      } else {
        // Insert new record
        await db.insert(performanceMetrics).values({
          id: crypto.randomUUID(),
          bucketTimestamp: metric.bucketTimestamp,
          accountId: metric.accountId,
          type: metric.type,
          avgDuration: metric.avgDuration.toFixed(2),
          recordCount: metric.recordCount,
          uploadedBy: user.id,
        });
      }
    });

    await Promise.all(insertPromises);

    return NextResponse.json({
      success: true,
      message: "CSV processed successfully",
      stats: result.stats,
      warnings:
        result.errors && result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
