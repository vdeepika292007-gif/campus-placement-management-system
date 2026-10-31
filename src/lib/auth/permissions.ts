import { getSession, SessionUser } from "./session";
import { redirect } from "next/navigation";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access: You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication required: Please sign in to continue.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Requires a signed-in user session. Redirects to /sign-in if redirectOnFail is true.
 */
export async function requireAuth(redirectOnFail = true): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    if (redirectOnFail) {
      redirect("/sign-in");
    }
    throw new AuthenticationError();
  }
  return session;
}

/**
 * Requires an administrator role. Redirects to /unauthorized if not an admin.
 */
export async function requireAdmin(redirectOnFail = true): Promise<SessionUser> {
  const session = await requireAuth(redirectOnFail);
  if (session.role !== "ADMIN") {
    if (redirectOnFail) {
      redirect("/unauthorized");
    }
    throw new AuthorizationError("Only Placement Administrators can access this area.");
  }
  return session;
}

/**
 * Requires a student role. Redirects to /unauthorized if not a student.
 */
export async function requireStudent(redirectOnFail = true): Promise<SessionUser> {
  const session = await requireAuth(redirectOnFail);
  if (session.role !== "STUDENT") {
    if (redirectOnFail) {
      redirect("/admin/dashboard");
    }
    throw new AuthorizationError("Students only area.");
  }
  return session;
}

/**
 * Enforces horizontal isolation:
 * Ensures the actor is either an authorized administrator or the exact student whose record is being accessed.
 */
export async function assertCanAccessStudent(studentUserId: string): Promise<SessionUser> {
  const session = await requireAuth(false);

  if (session.role === "ADMIN") {
    return session;
  }

  if (session.id !== studentUserId) {
    throw new AuthorizationError("You cannot view or modify another student's private records.");
  }

  return session;
}
