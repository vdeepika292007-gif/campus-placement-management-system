import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabaseReady } from "@/lib/db";
import { signInSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    // Ensure database schema and seeds are active
    await ensureDatabaseReady();

    const body = await req.json();
    const result = signInSchema.safeParse(body);

    if (!result.success) {
      console.warn("[Auth API] Validation error on sign-in payload:", result.error.issues);
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password, intendedRole } = result.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.warn(`[Auth API] Sign-in failed: Account with email "${email}" not found.`);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.accountStatus === "SUSPENDED") {
      console.warn(`[Auth API] Sign-in blocked: Account "${email}" is SUSPENDED.`);
      return NextResponse.json(
        { success: false, error: "Your account has been suspended. Please contact the placement cell." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      console.warn(`[Auth API] Sign-in failed: Password mismatch for user "${email}".`);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Role Enforcement: A student cannot log in through Admin flow
    if (intendedRole === "ADMIN" && user.role !== "ADMIN") {
      console.warn(
        `[Auth API] Access denied: User "${email}" with role "${user.role}" attempted Admin Login.`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: This account is registered as a Student. Please use the Student Login.",
        },
        { status: 403 }
      );
    }

    // Set secure HttpOnly session cookie
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    console.log(`[Auth API] Sign-in successful for user "${email}" (Role: ${user.role}).`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[Auth API] Critical server error during sign-in:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during sign in. Please try again." },
      { status: 500 }
    );
  }
}
