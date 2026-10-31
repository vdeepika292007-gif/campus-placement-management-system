import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerStudentSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.issues[0]?.message || "Invalid registration data" },
        { status: 400 }
      );
    }

    const { name, email, password, department, graduationYear, studentNumber, phone } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user and profile transactionally. Note: role is strictly hardcoded to STUDENT.
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "STUDENT", // Enforced server-side: public registration can NEVER create an ADMIN
          accountStatus: "ACTIVE",
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: user.id,
          department,
          graduationYear,
          studentNumber: studentNumber || null,
          phone: phone || null,
          skills: [],
        },
      });

      // Send initial welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to CPMS!",
          message: "Your student account has been registered. Please complete your skills and CGPA to check drive eligibility.",
          type: "INFO",
          linkUrl: "/student/profile",
        },
      });

      return user;
    });

    // Automatically establish session
    await setSessionCookie({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to complete registration. Please try again later." },
      { status: 500 }
    );
  }
}
