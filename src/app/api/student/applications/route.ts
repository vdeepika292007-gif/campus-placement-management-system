import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/permissions";
import { evaluateEligibility } from "@/lib/eligibility/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireStudent(false);

    // Fetch only this student's applications (strict horizontal privacy)
    const applications = await prisma.application.findMany({
      where: { studentId: session.id },
      include: {
        placementDrive: {
          include: {
            company: true,
            recruitmentRounds: {
              orderBy: { sequence: "asc" },
            },
          },
        },
        roundResults: {
          include: { recruitmentRound: true },
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Fetch student applications error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve your applications." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireStudent(false);
    const body = await req.json();

    const { placementDriveId } = body;
    if (!placementDriveId) {
      return NextResponse.json(
        { success: false, error: "Placement drive ID is required." },
        { status: 400 }
      );
    }

    // 1. Fetch drive details
    const drive = await prisma.placementDrive.findUnique({
      where: { id: placementDriveId },
      include: { company: true },
    });

    if (!drive) {
      return NextResponse.json(
        { success: false, error: "Placement drive not found." },
        { status: 404 }
      );
    }

    // 2. Enforce drive status: Must be PUBLISHED
    if (drive.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: "This placement drive is not currently accepting applications." },
        { status: 400 }
      );
    }

    // 3. Enforce deadline
    if (new Date(drive.deadlineAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "The application deadline for this drive has passed." },
        { status: 400 }
      );
    }

    // 4. Duplicate Check
    const existingApp = await prisma.application.findUnique({
      where: {
        studentId_placementDriveId: {
          studentId: session.id,
          placementDriveId,
        },
      },
    });

    if (existingApp) {
      return NextResponse.json(
        { success: false, error: "You have already applied to this placement drive." },
        { status: 409 }
      );
    }

    // 5. Server-side eligibility re-computation (Zero trust on client-side eligibility claim)
    const studentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { studentProfile: true },
    });

    const eligibility = evaluateEligibility(studentUser?.studentProfile, {
      eligibleBranches: drive.eligibleBranches,
      eligibleGradYears: drive.eligibleGradYears,
      minimumCgpa: drive.minimumCgpa,
      requiredSkills: drive.requiredSkills,
    });

    if (!eligibility.canApply) {
      return NextResponse.json(
        {
          success: false,
          error: `Application rejected: ${eligibility.summary}`,
          checks: eligibility.checks,
        },
        { status: 403 }
      );
    }

    // 6. Create Application, Status Log, Notification, and Audit Log in a single transaction
    const newApplication = await prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          studentId: session.id,
          placementDriveId,
          status: "APPLIED",
        },
      });

      // Initial status log
      await tx.applicationStatusLog.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: "APPLIED",
          changedByUserId: session.id,
          reason: "Initial student application submitted",
        },
      });

      // Confirmation notification to student
      await tx.notification.create({
        data: {
          userId: session.id,
          title: "Application Submitted Successfully",
          message: `Your application for ${drive.title} at ${drive.company.name} has been received.`,
          type: "SUCCESS",
          linkUrl: "/student/applications",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          action: "APPLICATION_SUBMITTED",
          entityType: "Application",
          entityId: application.id,
          details: JSON.stringify({
            driveTitle: drive.title,
            companyName: drive.company.name,
          }),
        },
      });

      return application;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully.",
        application: newApplication,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
