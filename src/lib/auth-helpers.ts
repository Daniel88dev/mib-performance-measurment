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

  console.log("[AUTH DEBUG] Cookie token:", cookieToken ? "EXISTS" : "MISSING");
  console.log("[AUTH DEBUG] All cookies:", cookieStore.getAll().map(c => c.name));

  if (!cookieToken) {
    console.log("[AUTH DEBUG] No session token cookie found");
    return null;
  }

  // Better Auth uses signed tokens in format: sessionId.signature
  // The database stores only the sessionId (first part before the dot)
  const sessionToken = cookieToken.split('.')[0];
  console.log("[AUTH DEBUG] Session token (first part):", sessionToken);

  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.token, sessionToken),
        gt(sessions.expiresAt, new Date())
      ))
      .limit(1);

    console.log("[AUTH DEBUG] Session found in DB:", !!session);
    if (session) {
      console.log("[AUTH DEBUG] Session user:", session.userId);
    }

    return session;
  } catch (error) {
    console.error("[AUTH DEBUG] Error getting session:", error);
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
  console.log("[AUTH DEBUG] requireApproved called");
  const session = await requireAuth();
  console.log("[AUTH DEBUG] Session after requireAuth:", !!session);

  const user = await getUser();
  console.log("[AUTH DEBUG] User after getUser:", user ? user.email : "NO USER");

  if (!user) {
    console.log("[AUTH DEBUG] No user, redirecting to sign-in");
    redirect("/sign-in");
  }

  if (!user.isApproved) {
    console.log("[AUTH DEBUG] User not approved, redirecting to pending-approval");
    redirect("/pending-approval");
  }

  console.log("[AUTH DEBUG] User approved, access granted");
  return { session, user };
}
