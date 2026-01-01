import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { performanceMetrics } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Configure route segment
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

type AggregatedMetric = {
  bucketTimestamp: string; // ISO string
  accountId: string;
  type: string;
  avgDuration: number;
  recordCount: number;
};

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

    // Parse JSON body with aggregated data
    const body = await request.json();
    const { aggregatedData, stats } = body as {
      aggregatedData: AggregatedMetric[];
      stats: {
        totalRows: number;
        validRows: number;
        filteredRows: number;
        aggregatedGroups: number;
      };
    };

    if (!aggregatedData || !Array.isArray(aggregatedData)) {
      return NextResponse.json(
        { error: "Invalid aggregated data format" },
        { status: 400 }
      );
    }

    // Insert or update aggregated data in database
    const insertPromises = aggregatedData.map(async (metric) => {
      const bucketTimestamp = new Date(metric.bucketTimestamp);

      // Check if record already exists
      const existing = await db.query.performanceMetrics.findFirst({
        where: and(
          eq(performanceMetrics.bucketTimestamp, bucketTimestamp),
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
          bucketTimestamp,
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
      message: "Data processed successfully",
      stats,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}