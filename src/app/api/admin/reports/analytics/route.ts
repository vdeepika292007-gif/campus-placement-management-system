import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { DriveStatus, ApplicationStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Enforce admin authorization
    await requireAdmin(false);

    // 2. Parse query parameters for filters
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year") || "ALL";
    const deptParam = searchParams.get("department") || "ALL";
    const companyParam = searchParams.get("companyId") || "ALL";
    const driveStatusParam = searchParams.get("driveStatus") || "ALL";

    // 3. Build where clauses based on active filters
    const studentProfileWhere: Prisma.StudentProfileWhereInput = {};
    if (yearParam !== "ALL") {
      const parsedYear = parseInt(yearParam, 10);
      if (!isNaN(parsedYear)) {
        studentProfileWhere.graduationYear = parsedYear;
      }
    }
    if (deptParam !== "ALL") {
      studentProfileWhere.department = deptParam;
    }

    const studentUserWhere: Prisma.UserWhereInput = {
      role: "STUDENT",
      ...(Object.keys(studentProfileWhere).length > 0
        ? { studentProfile: studentProfileWhere }
        : {}),
    };

    const driveWhere: Prisma.PlacementDriveWhereInput = {};
    if (companyParam !== "ALL") {
      driveWhere.companyId = companyParam;
    }
    if (driveStatusParam !== "ALL" && Object.values(DriveStatus).includes(driveStatusParam as DriveStatus)) {
      driveWhere.status = driveStatusParam as DriveStatus;
    }

    // Application where: joins student criteria and drive criteria
    const applicationWhere: Prisma.ApplicationWhereInput = {
      ...(Object.keys(driveWhere).length > 0 ? { placementDrive: driveWhere } : {}),
      ...(Object.keys(studentUserWhere).length > 0 ? { student: studentUserWhere } : {}),
    };

    // 4. Fetch aggregate totals & options in parallel
    const [
      totalStudents,
      totalCompanies,
      totalDrives,
      totalApplications,
      applications,
      allDrivesForFilter,
      allCompanies,
      distinctYearsResult,
      distinctDeptsResult,
    ] = await Promise.all([
      prisma.user.count({ where: studentUserWhere }),
      prisma.company.count({
        where: {
          isArchived: false,
          ...(companyParam !== "ALL" ? { id: companyParam } : {}),
        },
      }),
      prisma.placementDrive.count({ where: driveWhere }),
      prisma.application.count({ where: applicationWhere }),
      prisma.application.findMany({
        where: applicationWhere,
        select: {
          id: true,
          studentId: true,
          status: true,
          appliedAt: true,
          placementDrive: {
            select: {
              id: true,
              title: true,
              status: true,
              companyId: true,
              company: { select: { id: true, name: true } },
            },
          },
          student: {
            select: {
              id: true,
              studentProfile: {
                select: {
                  department: true,
                  graduationYear: true,
                },
              },
            },
          },
        },
      }),
      prisma.placementDrive.findMany({
        where: driveWhere,
        include: {
          company: { select: { id: true, name: true } },
          applications: {
            where: Object.keys(studentUserWhere).length > 0 ? { student: studentUserWhere } : undefined,
            select: { id: true, status: true, studentId: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.findMany({
        where: { isArchived: false },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.studentProfile.findMany({
        select: { graduationYear: true },
        distinct: ["graduationYear"],
        orderBy: { graduationYear: "asc" },
      }),
      prisma.studentProfile.findMany({
        select: { department: true },
        distinct: ["department"],
        orderBy: { department: "asc" },
      }),
    ]);

    // 5. Compute distinct student metrics & placement rate
    const offerApplications = applications.filter(
      (a) => a.status === ApplicationStatus.SELECTED || a.status === ApplicationStatus.OFFER_RECORDED
    );
    const totalOffers = offerApplications.length;

    // Unique students who received at least one offer (avoiding double-counting multiple offers to the same student)
    const uniquePlacedStudentIds = new Set(offerApplications.map((a) => a.studentId));
    const uniquePlacedStudents = uniquePlacedStudentIds.size;

    const placementRate = totalStudents > 0
      ? Number(((uniquePlacedStudents / totalStudents) * 100).toFixed(1))
      : 0;

    // 6. Chart 1: Students by Department
    // We group student profiles matching the filter
    const deptCountMap: Record<string, number> = {};
    const studentProfiles = await prisma.studentProfile.findMany({
      where: studentProfileWhere,
      select: { department: true },
    });
    studentProfiles.forEach((p) => {
      deptCountMap[p.department] = (deptCountMap[p.department] || 0) + 1;
    });

    const studentsByDepartment = Object.entries(deptCountMap)
      .map(([department, count]) => ({
        department,
        count,
        percentage: totalStudents > 0 ? Number(((count / totalStudents) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 7. Chart 2: Applications by Status
    const statusMeta: Record<string, { label: string; color: string }> = {
      APPLIED: { label: "Applied", color: "#3b82f6" }, // blue
      UNDER_REVIEW: { label: "Under Review", color: "#06b6d4" }, // cyan
      SHORTLISTED: { label: "Shortlisted", color: "#8b5cf6" }, // purple
      ASSESSMENT_SCHEDULED: { label: "Assessment", color: "#6366f1" }, // indigo
      INTERVIEW_SCHEDULED: { label: "Interview", color: "#f59e0b" }, // amber
      SELECTED: { label: "Selected", color: "#10b981" }, // emerald
      OFFER_RECORDED: { label: "Offer Recorded", color: "#14b8a6" }, // teal
      REJECTED: { label: "Rejected", color: "#f43f5e" }, // rose
      WITHDRAWN: { label: "Withdrawn", color: "#64748b" }, // slate
    };

    const statusCountMap: Record<string, number> = {};
    applications.forEach((a) => {
      statusCountMap[a.status] = (statusCountMap[a.status] || 0) + 1;
    });

    const applicationsByStatus = Object.entries(statusMeta).map(([statusKey, meta]) => {
      const count = statusCountMap[statusKey] || 0;
      return {
        status: statusKey,
        label: meta.label,
        count,
        percentage: totalApplications > 0 ? Number(((count / totalApplications) * 100).toFixed(1)) : 0,
        color: meta.color,
      };
    });

    // 8. Chart 3: Applications & Offers by Company (Top Companies)
    const companyStatsMap: Record<string, { id: string; name: string; applications: number; offers: number }> = {};
    applications.forEach((a) => {
      const cId = a.placementDrive.companyId;
      const cName = a.placementDrive.company.name;
      if (!companyStatsMap[cId]) {
        companyStatsMap[cId] = { id: cId, name: cName, applications: 0, offers: 0 };
      }
      companyStatsMap[cId].applications++;
      if (a.status === ApplicationStatus.SELECTED || a.status === ApplicationStatus.OFFER_RECORDED) {
        companyStatsMap[cId].offers++;
      }
    });

    const companyPerformance = Object.values(companyStatsMap)
      .map((c) => ({
        companyId: c.id,
        name: c.name,
        applications: c.applications,
        offers: c.offers,
        conversionRate: c.applications > 0 ? Number(((c.offers / c.applications) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 8);

    // 9. Chart 4: Placement Drives by Status
    const driveStatusCounts: Record<string, number> = {
      PUBLISHED: 0,
      CLOSED: 0,
      DRAFT: 0,
      ARCHIVED: 0,
    };
    allDrivesForFilter.forEach((d) => {
      if (driveStatusCounts[d.status] !== undefined) {
        driveStatusCounts[d.status]++;
      }
    });

    const drivesByStatus = [
      { status: "PUBLISHED", label: "Published / Active", count: driveStatusCounts.PUBLISHED, color: "#10b981" },
      { status: "CLOSED", label: "Closed", count: driveStatusCounts.CLOSED, color: "#f59e0b" },
      { status: "DRAFT", label: "Draft", count: driveStatusCounts.DRAFT, color: "#6366f1" },
      { status: "ARCHIVED", label: "Archived", count: driveStatusCounts.ARCHIVED, color: "#64748b" },
    ];

    // 10. Chart 5: Placement Outcomes Over Time (Daily Timeline)
    const timelineMap: Record<string, { applications: number; offers: number }> = {};
    applications.forEach((a) => {
      const dateStr = a.appliedAt.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = { applications: 0, offers: 0 };
      }
      timelineMap[dateStr].applications++;
      if (a.status === ApplicationStatus.SELECTED || a.status === ApplicationStatus.OFFER_RECORDED) {
        timelineMap[dateStr].offers++;
      }
    });

    const timeline = Object.entries(timelineMap)
      .map(([date, counts]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        applications: counts.applications,
        offers: counts.offers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 11. Reports Table Breakdown (Drive-by-Drive performance)
    const reportsTable = allDrivesForFilter.map((d) => {
      const driveApps = d.applications;
      const shortlisted = driveApps.filter(
        (a) =>
          a.status === ApplicationStatus.SHORTLISTED ||
          a.status === ApplicationStatus.ASSESSMENT_SCHEDULED ||
          a.status === ApplicationStatus.INTERVIEW_SCHEDULED
      ).length;
      const selected = driveApps.filter((a) => a.status === ApplicationStatus.SELECTED).length;
      const offers = driveApps.filter((a) => a.status === ApplicationStatus.OFFER_RECORDED).length;
      const totalDriveOffers = selected + offers;
      const conversionRate = driveApps.length > 0
        ? Number(((totalDriveOffers / driveApps.length) * 100).toFixed(1))
        : 0;

      return {
        id: d.id,
        title: d.title,
        companyName: d.company.name,
        companyId: d.company.id,
        status: d.status,
        jobType: d.jobType || "Full-time",
        eligibleBranches: d.eligibleBranches,
        deadlineAt: d.deadlineAt.toISOString(),
        totalApplicants: driveApps.length,
        shortlistedCount: shortlisted,
        selectedCount: selected,
        offersCount: offers,
        totalOffers: totalDriveOffers,
        conversionRate,
      };
    });

    return NextResponse.json({
      success: true,
      filters: {
        year: yearParam,
        department: deptParam,
        companyId: companyParam,
        driveStatus: driveStatusParam,
      },
      availableFilters: {
        years: distinctYearsResult.map((y) => y.graduationYear),
        departments: distinctDeptsResult.map((d) => d.department),
        companies: allCompanies,
        driveStatuses: ["ALL", "PUBLISHED", "CLOSED", "DRAFT", "ARCHIVED"],
      },
      summary: {
        totalStudents,
        totalCompanies,
        totalDrives,
        totalApplications,
        totalOffers,
        uniquePlacedStudents,
        placementRate,
        formula: "Placement Rate = (Unique Students Placed / Total Candidates) × 100",
      },
      charts: {
        studentsByDepartment,
        applicationsByStatus,
        companyPerformance,
        drivesByStatus,
        timeline,
      },
      reportsTable,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "AuthenticationError" || err.name === "AuthorizationError") {
      return NextResponse.json(
        { success: false, error: err.message || "Unauthorized access." },
        { status: 403 }
      );
    }
    console.error("[Analytics API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate analytics and reports." },
      { status: 500 }
    );
  }
}
