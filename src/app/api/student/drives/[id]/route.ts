import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudent(false);
    const { id } = await params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        company: true,
        recruitmentRounds: {
          orderBy: { sequence: "asc" },
        },
      },
    });

    if (!drive) {
      return NextResponse.json({ success: false, error: "Placement drive not found" }, { status: 404 });
    }

    // Check application status for this student
    const application = await prisma.application.findUnique({
      where: {
        studentId_placementDriveId: {
          studentId: session.id,
          placementDriveId: id,
        },
      },
      include: {
        roundResults: {
          include: { recruitmentRound: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // If drive is DRAFT or ARCHIVED, students cannot view it unless they have an existing application
    if (drive.status === "DRAFT" || drive.status === "ARCHIVED") {
      if (!application) {
        return NextResponse.json(
          { success: false, error: "This placement drive is not published or has concluded." },
          { status: 403 }
        );
      }
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { studentProfile: true },
    });

    const isExpired = new Date(drive.deadlineAt).getTime() < Date.now();

    return NextResponse.json({
      success: true,
      drive,
      application,
      studentProfile: studentUser?.studentProfile || null,
      isExpired,
    });
  } catch (error) {
    console.error("Student drive details error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve drive details." },
      { status: 500 }
    );
  }
}
