import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { companySchema } from "@/lib/validation/company";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(false);
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        drives: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Get company details error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load company details." },
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

    const parseResult = companySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, description, website, industry, location, isArchived } = parseResult.data;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        description,
        website: website || null,
        industry: industry || null,
        location: location || null,
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        action: "COMPANY_UPDATED",
        entityType: "Company",
        entityId: company.id,
        details: JSON.stringify({ name: company.name }),
      },
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company." },
      { status: 500 }
    );
  }
}

// Archive / Unarchive toggle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(false);
    const { id } = await params;

    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        isArchived: !existing.isArchived,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.id,
        action: updated.isArchived ? "COMPANY_ARCHIVED" : "COMPANY_UNARCHIVED",
        entityType: "Company",
        entityId: updated.id,
        details: JSON.stringify({ name: updated.name, archived: updated.isArchived }),
      },
    });

    return NextResponse.json({
      success: true,
      message: updated.isArchived ? "Company archived successfully" : "Company restored successfully",
      company: updated,
    });
  } catch (error) {
    console.error("Archive company error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company archive status." },
      { status: 500 }
    );
  }
}

// Unsafe deletion prevention
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(false);
    const { id } = await params;

    const driveCount = await prisma.placementDrive.count({
      where: { companyId: id },
    });

    if (driveCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete company with ${driveCount} associated placement drive(s). Archive the company instead to preserve records.`,
        },
        { status: 400 }
      );
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Company deleted." });
  } catch (error) {
    console.error("Delete company error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to delete company." },
      { status: 500 }
    );
  }
}
