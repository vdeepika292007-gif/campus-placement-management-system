import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { DriveStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(false);
    const { id } = await params;
    const body = await req.json();

    const { status } = body;

    if (!Object.values(DriveStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid placement drive status." },
        { status: 400 }
      );
    }

    const drive = await prisma.placementDrive.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!drive) {
      return NextResponse.json(
        { success: false, error: "Placement drive not found." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedDrive = await tx.placementDrive.update({
        where: { id },
        data: { status },
      });

      // If published, notify eligible registered students
      if (status === "PUBLISHED" && drive.status !== "PUBLISHED") {
        const eligibleStudents = await tx.user.findMany({
          where: {
            role: "STUDENT",
            studentProfile: {
              department: { in: drive.eligibleBranches },
              graduationYear: { in: drive.eligibleGradYears },
            },
          },
          select: { id: true },
        });

        if (eligibleStudents.length > 0) {
          await tx.notification.createMany({
            data: eligibleStudents.map((s) => ({
              userId: s.id,
              title: "New Placement Drive Published!",
              message: `${drive.company.name} has published a drive for ${drive.title}. Applications are now open.`,
              type: "INFO",
              linkUrl: `/student/drives/${drive.id}`,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          action: "DRIVE_STATUS_CHANGED",
          entityType: "PlacementDrive",
          entityId: drive.id,
          details: JSON.stringify({
            fromStatus: drive.status,
            toStatus: status,
            title: drive.title,
          }),
        },
      });

      return updatedDrive;
    });

    return NextResponse.json({
      success: true,
      message: `Drive status updated to ${status}.`,
      drive: updated,
    });
  } catch (error) {
    console.error("Change drive status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update drive status." },
      { status: 500 }
    );
  }
}
