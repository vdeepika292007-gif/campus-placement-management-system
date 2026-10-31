import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatSalary } from "@/lib/utils";
import {
  BarChart3,
  Download,
  Users,
  Briefcase,
  Award,
  CheckCircle2,
  Building2,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();

  // Aggregate live metrics
  const [
    totalStudents,
    totalApplications,
    selectedCount,
    offersCount,
    drives,
    departmentsSummary,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "SELECTED" } }),
    prisma.application.count({ where: { status: "OFFER_RECORDED" } }),
    prisma.placementDrive.findMany({
      include: {
        company: true,
        applications: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studentProfile.groupBy({
      by: ["department"],
      _count: { userId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Placement Analytics"
        description="Comprehensive placement statistics, conversion metrics across visiting drives, and college compliance exports."
        actions={
          <a href="/api/admin/reports/export">
            <Button variant="primary" size="md">
              <Download className="h-4 w-4 mr-1.5" />
              Export Full Report (CSV)
            </Button>
          </a>
        }
      />

      {/* Metric Definitions Alert */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Metric Definitions & Integrity Disclosure</p>
          <p className="text-slate-600 leading-relaxed">
            Every displayed statistic is derived directly from persisted PostgreSQL records. Total Applications represents aggregate submissions across all drives. Offers Recorded indicates verified student offer letters accepted.
          </p>
        </div>
      </div>

      {/* Summary Aggregate Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Unique Candidates
            </span>
            <span className="text-2xl font-extrabold text-slate-900 block">{totalStudents}</span>
            <span className="text-[10px] text-slate-400">Registered student profiles</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Applications
            </span>
            <span className="text-2xl font-extrabold text-blue-700 block">{totalApplications}</span>
            <span className="text-[10px] text-slate-400">Submissions across all drives</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Candidates Selected
            </span>
            <span className="text-2xl font-extrabold text-purple-700 block">{selectedCount}</span>
            <span className="text-[10px] text-slate-400">Interview stage cleared</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Offers Recorded
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 block">{offersCount}</span>
            <span className="text-[10px] text-slate-400">Confirmed recruitment offers</span>
          </CardContent>
        </Card>
      </div>

      {/* Drive-by-Drive Conversion Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recruitment Drive Performance & Intake Summary</CardTitle>
            <span className="text-xs text-slate-400">{drives.length} Configured Drives</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="py-3 px-4">Placement Drive</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Applicants</th>
                  <th className="py-3 px-4">Shortlisted</th>
                  <th className="py-3 px-4">Offers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drives.map((drive) => {
                  const apps = drive.applications;
                  const shortlisted = apps.filter(
                    (a) =>
                      a.status === "SHORTLISTED" ||
                      a.status === "ASSESSMENT_SCHEDULED" ||
                      a.status === "INTERVIEW_SCHEDULED"
                  ).length;
                  const driveOffers = apps.filter(
                    (a) => a.status === "SELECTED" || a.status === "OFFER_RECORDED"
                  ).length;

                  return (
                    <tr key={drive.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{drive.title}</td>
                      <td className="py-3.5 px-4 text-slate-700">{drive.company.name}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            drive.status === "PUBLISHED"
                              ? "success"
                              : drive.status === "DRAFT"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {drive.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{apps.length}</td>
                      <td className="py-3.5 px-4 text-purple-700 font-semibold">{shortlisted}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-bold">{driveOffers}</td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/api/admin/reports/export?driveId=${drive.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>CSV</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Department Roster Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Department-Wise Registered Student Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departmentsSummary.map((d) => (
              <div
                key={d.department}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-slate-800">{d.department}</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                  {d._count.userId} Students
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
