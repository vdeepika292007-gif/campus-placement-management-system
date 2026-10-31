import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { ApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(false);
    const { id } = await params;
    const body = await req.json();

    const { status, reason } = body;

    if (!Object.values(ApplicationStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid application status transition." },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        student: true,
        placementDrive: {
          include: { company: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application record not found." },
        { status: 404 }
      );
    }

    const previousStatus = application.status;

    // Transactionally update status, write history log, and notify student
    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { status },
      });

      // Status history entry
      await tx.applicationStatusLog.create({
        data: {
          applicationId: id,
          fromStatus: previousStatus,
          toStatus: status,
          changedByUserId: session.id,
          reason: reason || `Status changed from ${previousStatus} to ${status}`,
        },
      });

      // In-app notification for the affected student
      await tx.notification.create({
        data: {
          userId: application.studentId,
          title: `Application Status Updated: ${status.replace(/_/g, " ")}`,
          message: `Your application for ${application.placementDrive.title} at ${application.placementDrive.company.name} has been updated to ${status.replace(/_/g, " ")}.`,
          type: status === "SELECTED" || status === "OFFER_RECORDED" ? "SUCCESS" : status === "REJECTED" ? "WARNING" : "INFO",
          linkUrl: "/student/applications",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          action: "APPLICATION_STATUS_UPDATED",
          entityType: "Application",
          entityId: id,
          details: JSON.stringify({
            studentName: application.student.name,
            fromStatus: previousStatus,
            toStatus: status,
            reason: reason || null,
          }),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}.`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Update applicant status error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update application status." },
      { status: 500 }
    );
  }
}
