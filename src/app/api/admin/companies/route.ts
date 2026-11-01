import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { companySchema } from "@/lib/validation/company";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(false);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const filter = searchParams.get("status") || "active"; // "active", "archived", "all"

    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "active") {
      whereClause.isArchived = false;
    } else if (filter === "archived") {
      whereClause.isArchived = true;
    }

    const companies = await prisma.company.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { drives: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error("Admin companies fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve companies." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(false);
    const body = await req.json();

    const parseResult = companySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid company details" },
        { status: 400 }
      );
    }

    const { name, description, website, industry, location, logoUrl, companySize } = parseResult.data;

    const company = await prisma.company.create({
      data: {
        name,
        description,
        website: website || null,
        industry: industry || null,
        location: location || null,
        logoUrl: logoUrl || null,
        companySize: companySize || null,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        action: "COMPANY_CREATED",
        entityType: "Company",
        entityId: company.id,
        details: JSON.stringify({ name: company.name }),
      },
    });

    return NextResponse.json({ success: true, company }, { status: 201 });
  } catch (error) {
    console.error("Create company error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create company record." },
      { status: 500 }
    );
  }
}
