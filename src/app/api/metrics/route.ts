import { NextRequest, NextResponse } from "next/server";
import { getSession, getUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { performanceMetrics } from "@/db/schema";
import { and, gte, lte, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const accountIds = searchParams.get("accountIds")?.split(",").filter(Boolean);
    const types = searchParams.get("types")?.split(",").filter(Boolean);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const noLimit = searchParams.get("noLimit") === "true";
    const limit = noLimit ? undefined : parseInt(searchParams.get("limit") || "100");
    const offset = noLimit ? undefined : parseInt(searchParams.get("offset") || "0");

    // Build where conditions
    const conditions = [];

    if (accountIds && accountIds.length > 0) {
      conditions.push(inArray(performanceMetrics.accountId, accountIds));
    }

    if (types && types.length > 0) {
      conditions.push(inArray(performanceMetrics.type, types));
    }

    if (startDate) {
      conditions.push(gte(performanceMetrics.bucketTimestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(performanceMetrics.bucketTimestamp, new Date(endDate)));
    }

    // Fetch metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryOptions: any = {
      where: conditions.length > 0 ? and(...conditions) : undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: (metrics: any, { desc }: any) => [desc(metrics.bucketTimestamp)],
    };

    // Only add limit and offset if not requesting all data
    if (!noLimit) {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const metrics = await db.query.performanceMetrics.findMany(queryOptions);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(performanceMetrics)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult.count);

    return NextResponse.json({
      success: true,
      data: metrics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset ?? 0) + metrics.length < total,
      },
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
