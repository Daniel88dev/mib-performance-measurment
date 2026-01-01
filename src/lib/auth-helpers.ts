import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { redirect } from "next/navigation";

/**
 * Get the current session server-side by querying database directly
 */
export async function getSession() {
  const cookieStore = await cookies();
  // Better Auth adds __Secure- prefix in production (HTTPS)
  const cookieToken =
    cookieStore.get("__Secure-better-auth.session_token")?.value ||
    cookieStore.get("better-auth.session_token")?.value;

  if (!cookieToken) {
    return null;
  }

  // Better Auth uses signed tokens in format: sessionId.signature
  // The database stores only the sessionId (first part before the dot)
  const sessionToken = cookieToken.split('.')[0];

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, sessionToken),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user including isApproved status
 */
export async function getUser() {
  const session = await getSession();

  if (!session?.userId) {
    return null;
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    return user;
  } catch (error) {
    console.error("[getUser] Error getting user:", error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Require user to be approved - throws if not approved
 */
export async function requireApproved() {
  const session = await requireAuth();
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isApproved) {
    redirect("/pending-approval");
  }

  return { session, user };
}
