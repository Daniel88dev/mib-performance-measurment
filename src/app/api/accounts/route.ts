import { NextResponse } from "next/server";
import { getSession, getUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { performanceMetrics } from "@/db/schema";

export async function GET() {
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

    // Get distinct account IDs
    const accounts = await db
      .selectDistinct({ accountId: performanceMetrics.accountId })
      .from(performanceMetrics)
      .orderBy(performanceMetrics.accountId);

    return NextResponse.json({
      success: true,
      data: accounts.map((a) => a.accountId),
    });
  } catch (error) {
    console.error("Accounts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
