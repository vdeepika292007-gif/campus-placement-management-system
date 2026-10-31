import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DriveStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatSalary } from "@/lib/utils";
import {
  Building2,
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Plus,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
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
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Companies</span>
        </Link>
      </div>

      <PageHeader
        title={company.name}
        description={company.industry || "Visiting Enterprise Partner"}
        badge={
          company.isArchived ? (
            <Badge variant="neutral">Archived</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )
        }
        actions={
          <Link href={`/admin/drives/new?companyId=${company.id}`}>
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Drive for {company.name.split(" ")[0]}
            </Button>
          </Link>
        }
      />

      {/* Company Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
            {company.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-600 border-t border-slate-100">
            {company.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{company.location}</span>
              </div>
            )}

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>{company.website}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Registered on {formatDate(company.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related Placement Drives */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recruitment Drives ({company.drives.length})
          </h2>
        </div>

        {company.drives.length === 0 ? (
          <EmptyState
            title="No placement drives posted yet"
            description="Create the first recruitment drive for this company to begin accepting student applications."
            actionLabel="Create Placement Drive"
            icon={<Briefcase className="h-6 w-6" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.drives.map((drive) => (
              <Card key={drive.id} className="p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{drive.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)} • {drive.location || "On Campus"}
                    </p>
                  </div>
                  <DriveStatusBadge status={drive.status} />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{drive._count.applications} Applicants</span>
                  </div>

                  <span>Deadline: {formatDate(drive.deadlineAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
