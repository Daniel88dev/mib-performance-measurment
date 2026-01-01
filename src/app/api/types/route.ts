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

    // Get distinct types
    const types = await db
      .selectDistinct({ type: performanceMetrics.type })
      .from(performanceMetrics)
      .orderBy(performanceMetrics.type);

    return NextResponse.json({
      success: true,
      data: types.map((t) => t.type),
    });
  } catch (error) {
    console.error("Types API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
