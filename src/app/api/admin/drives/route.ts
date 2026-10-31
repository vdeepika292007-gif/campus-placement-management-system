import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { driveSchema } from "@/lib/validation/drive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(false);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "ALL"; // "ALL", "DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"
    const companyId = searchParams.get("companyId");

    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const drives = await prisma.placementDrive.findMany({
      where: whereClause,
      include: {
        company: true,
        recruitmentRounds: {
          orderBy: { sequence: "asc" },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, drives });
  } catch (error) {
    console.error("Admin drives fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load placement drives." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(false);
    const body = await req.json();

    const parseResult = driveSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid drive data" },
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

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Selected company does not exist." },
        { status: 404 }
      );
    }

    const drive = await prisma.$transaction(async (tx) => {
      const createdDrive = await tx.placementDrive.create({
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
          createdById: session.id,
        },
      });

      // Insert rounds if provided
      if (recruitmentRounds && recruitmentRounds.length > 0) {
        await tx.recruitmentRound.createMany({
          data: recruitmentRounds.map((r, idx) => ({
            placementDriveId: createdDrive.id,
            name: r.name,
            roundType: r.roundType,
            sequence: r.sequence || idx + 1,
            description: r.description || null,
            scheduledAt: r.scheduledAt ? new Date(r.scheduledAt) : null,
          })),
        });
      }

      // Log administrative audit action
      await tx.auditLog.create({
        data: {
          actorUserId: session.id,
          action: "DRIVE_CREATED",
          entityType: "PlacementDrive",
          entityId: createdDrive.id,
          details: JSON.stringify({
            title: createdDrive.title,
            company: company.name,
            status: createdDrive.status,
          }),
        },
      });

      return createdDrive;
    });

    return NextResponse.json({ success: true, drive }, { status: 201 });
  } catch (error) {
    console.error("Create drive error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create placement drive." },
      { status: 500 }
    );
  }
}
