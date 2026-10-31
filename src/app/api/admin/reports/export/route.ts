import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { formatDate, formatSalary } from "@/lib/utils";

export const dynamic = "force-dynamic";

function escapeCsvField(field: unknown): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(false);

    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get("driveId") || "";
    const status = searchParams.get("status") || "ALL";

    const whereClause: Record<string, unknown> = {};
    if (driveId) whereClause.placementDriveId = driveId;
    if (status !== "ALL") whereClause.status = status;

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: {
          include: { studentProfile: true },
        },
        placementDrive: {
          include: { company: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // CSV Header row
    const headers = [
      "Application ID",
      "Candidate Name",
      "Candidate Email",
      "Roll Number",
      "Department",
      "Graduation Batch",
      "CGPA",
      "Company",
      "Drive Title",
      "Job Type",
      "Package",
      "Application Status",
      "Applied Date",
    ];

    const rows = applications.map((app) => [
      escapeCsvField(app.id),
      escapeCsvField(app.student.name),
      escapeCsvField(app.student.email),
      escapeCsvField(app.student.studentProfile?.studentNumber || "N/A"),
      escapeCsvField(app.student.studentProfile?.department || "N/A"),
      escapeCsvField(app.student.studentProfile?.graduationYear || "N/A"),
      escapeCsvField(app.student.studentProfile?.cgpa ?? "N/A"),
      escapeCsvField(app.placementDrive.company.name),
      escapeCsvField(app.placementDrive.title),
      escapeCsvField(app.placementDrive.jobType || "Full-time"),
      escapeCsvField(
        formatSalary(
          app.placementDrive.salaryMin,
          app.placementDrive.salaryMax,
          app.placementDrive.salaryDisplay
        )
      ),
      escapeCsvField(app.status),
      escapeCsvField(formatDate(app.appliedAt)),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    // Log the export action
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        action: "REPORT_CSV_EXPORTED",
        entityType: "Report",
        entityId: "placement-records",
        details: JSON.stringify({ count: applications.length, filter: { driveId, status } }),
      },
    });

    const filename = `CPMS_Placement_Report_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
