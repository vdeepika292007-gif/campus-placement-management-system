import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { driveSchema } from "@/lib/validation/drive";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(false);
    const { id } = await params;

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: {
        company: true,
        recruitmentRounds: {
          orderBy: { sequence: "asc" },
        },
        applications: {
          include: {
            student: {
              include: { studentProfile: true },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
      },
    });

    if (!drive) {
      return NextResponse.json({ success: false, error: "Placement drive not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, drive });
  } catch (error) {
    console.error("Get drive error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve drive." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(false);
    const { id } = await params;
    const body = await req.json();

    const parseResult = driveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      companyId,
      title,
      jobDescription,
      jobType,
      location,
      salaryMin,
      salaryMax,
      salaryDisplay,
      deadlineAt,
      status,
      eligibleBranches,
      eligibleGradYears,
      minimumCgpa,
      requiredSkills,
      recruitmentRounds,
    } = parseResult.data;

    const updatedDrive = await prisma.$transaction(async (tx) => {
      const drive = await tx.placementDrive.update({
        where: { id },
        data: {
          companyId,
          title,
          jobDescription,
          jobType,
          location,
          salaryMin: salaryMin ?? null,
          salaryMax: salaryMax ?? null,
          salaryDisplay: salaryDisplay || null,
          deadlineAt: new Date(deadlineAt),
          status,
          eligibleBranches,
          eligibleGradYears,
          minimumCgpa: minimumCgpa ?? null,
          requiredSkills,
        },
      });

      // Synchronize rounds if provided
      if (recruitmentRounds) {
        // Delete existing rounds and recreate to preserve order
        await tx.recruitmentRound.deleteMany({
          where: { placementDriveId: id },
        });

        if (recruitmentRounds.length > 0) {
          await tx.recruitmentRound.createMany({
            data: recruitmentRounds.map((r, idx) => ({
              placementDriveId: id,
              name: r.name,
              roundType: r.roundType,
              sequence: r.sequence || idx + 1,
              description: r.description || null,
              scheduledAt: r.scheduledAt ? new Date(r.scheduledAt) : null,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          action: "DRIVE_UPDATED",
          entityType: "PlacementDrive",
          entityId: drive.id,
          details: JSON.stringify({ title: drive.title, status: drive.status }),
        },
      });

      return drive;
    });

    return NextResponse.json({ success: true, drive: updatedDrive });
  } catch (error) {
    console.error("Update drive error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update placement drive." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(false);
    const { id } = await params;

    const applicationCount = await prisma.application.count({
      where: { placementDriveId: id },
    });

    if (applicationCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete placement drive with ${applicationCount} submitted application(s). Mark the drive as CLOSED or ARCHIVED instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.placementDrive.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Drive removed successfully." });
  } catch (error) {
    console.error("Delete drive error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete placement drive." },
      { status: 500 }
    );
  }
}
