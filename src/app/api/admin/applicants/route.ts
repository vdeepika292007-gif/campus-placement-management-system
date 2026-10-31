import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(false);

    const { searchParams } = new URL(req.url);
    const driveId = searchParams.get("driveId") || "";
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("q")?.trim() || "";

    const whereClause: Record<string, unknown> = {};

    if (driveId) {
      whereClause.placementDriveId = driveId;
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { email: { contains: search, mode: "insensitive" } } },
        { student: { studentProfile: { department: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        student: {
          include: { studentProfile: true },
        },
        placementDrive: {
          include: { company: true },
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
    console.error("Admin applicants fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve applicants." },
      { status: 500 }
    );
  }
}
