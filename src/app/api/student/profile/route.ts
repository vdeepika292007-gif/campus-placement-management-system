import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/permissions";
import { updateStudentProfileSchema, calculateProfileCompleteness } from "@/lib/validation/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireStudent(false);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { studentProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const completeness = calculateProfileCompleteness(user.studentProfile || {});

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.studentProfile,
        completeness,
      },
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve profile." },
      { status: 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireStudent(false);
    const body = await req.json();

    const parseResult = updateStudentProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid profile data" },
        { status: 400 }
      );
    }

    const { department, graduationYear, cgpa, skills, phone, studentNumber, resumeReference } =
      parseResult.data;

    const normalizedSkills = Array.isArray(skills) ? skills : [];

    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: session.id },
      update: {
        department,
        graduationYear,
        cgpa: cgpa ?? null,
        skills: normalizedSkills,
        phone: phone || null,
        studentNumber: studentNumber || null,
        resumeReference: resumeReference || null,
      },
      create: {
        userId: session.id,
        department,
        graduationYear,
        cgpa: cgpa ?? null,
        skills: normalizedSkills,
        phone: phone || null,
        studentNumber: studentNumber || null,
        resumeReference: resumeReference || null,
      },
    });

    const completeness = calculateProfileCompleteness(updatedProfile);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
      completeness,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
