import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(false);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const branch = searchParams.get("branch")?.trim() || "";

    // Load student's profile to evaluate eligibility & application status
    const studentUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        studentProfile: true,
        applications: {
          select: { placementDriveId: true, status: true },
        },
      },
    });

    const whereClause: Record<string, unknown> = {
      // Non-negotiable security requirement: Students can ONLY query PUBLISHED drives
      status: "PUBLISHED",
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (branch) {
      whereClause.eligibleBranches = { has: branch };
    }

    const drives = await prisma.placementDrive.findMany({
      where: whereClause,
      include: {
        company: true,
        recruitmentRounds: {
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { deadlineAt: "asc" },
    });

    const appliedDriveMap = new Map(
      studentUser?.applications.map((app) => [app.placementDriveId, app.status]) || []
    );

    const enrichedDrives = drives.map((drive) => {
      const isApplied = appliedDriveMap.has(drive.id);
      const applicationStatus = appliedDriveMap.get(drive.id) || null;
      const isExpired = new Date(drive.deadlineAt).getTime() < Date.now();

      return {
        ...drive,
        isApplied,
        applicationStatus,
        isExpired,
      };
    });

    return NextResponse.json({
      success: true,
      drives: enrichedDrives,
      studentProfile: studentUser?.studentProfile || null,
    });
  } catch (error) {
    console.error("Student drives fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to retrieve placement drives." },
      { status: 500 }
    );
  }
}
