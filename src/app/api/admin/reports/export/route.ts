import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { formatDate, formatSalary } from "@/lib/utils";
import { Prisma, DriveStatus, ApplicationStatus } from "@prisma/client";

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
    const year = searchParams.get("year") || "ALL";
    const department = searchParams.get("department") || "ALL";
    const companyId = searchParams.get("companyId") || "ALL";
    const driveStatus = searchParams.get("driveStatus") || "ALL";

    // Build Prisma where clause
    const whereClause: Prisma.ApplicationWhereInput = {};

    if (driveId) {
      whereClause.placementDriveId = driveId;
    }

    if (status !== "ALL" && Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
      whereClause.status = status as ApplicationStatus;
    }

    // Drive filter criteria
    const driveWhere: Prisma.PlacementDriveWhereInput = {};
    if (companyId !== "ALL") {
      driveWhere.companyId = companyId;
    }
    if (driveStatus !== "ALL" && Object.values(DriveStatus).includes(driveStatus as DriveStatus)) {
      driveWhere.status = driveStatus as DriveStatus;
    }
    if (Object.keys(driveWhere).length > 0) {
      whereClause.placementDrive = driveWhere;
    }

    // Student filter criteria
    const studentProfileWhere: Prisma.StudentProfileWhereInput = {};
    if (year !== "ALL") {
      const parsedYear = parseInt(year, 10);
      if (!isNaN(parsedYear)) {
        studentProfileWhere.graduationYear = parsedYear;
      }
    }
    if (department !== "ALL") {
      studentProfileWhere.department = department;
    }

    if (Object.keys(studentProfileWhere).length > 0) {
      whereClause.student = {
        role: "STUDENT",
        studentProfile: studentProfileWhere,
      };
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                studentNumber: true,
                department: true,
                graduationYear: true,
                cgpa: true,
              },
            },
          },
        },
        placementDrive: {
          include: { company: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // CSV Header row (Strictly non-sensitive academic & placement metrics only)
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

    // Log the export action in audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        action: "REPORT_CSV_EXPORTED",
        entityType: "Report",
        entityId: "placement-records",
        details: JSON.stringify({
          count: applications.length,
          filters: { driveId, status, year, department, companyId, driveStatus },
        }),
      },
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `CPMS_Placement_Report_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "AuthenticationError" || err.name === "AuthorizationError") {
      return NextResponse.json(
        { success: false, error: err.message || "Unauthorized access." },
        { status: 403 }
      );
    }
    console.error("Export report error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
