import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DriveStatusBadge, ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatSalary } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  Users,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  BarChart3,
  Calendar,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  // 1. Live Database Queries
  const [
    totalCompanies,
    publishedDrivesCount,
    totalApplications,
    totalStudents,
    offersCount,
    recentApplications,
    upcomingDrives,
    recentAuditLogs,
    allApplications,
  ] = await Promise.all([
    prisma.company.count({ where: { isArchived: false } }),
    prisma.placementDrive.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.application.count({
      where: {
        OR: [{ status: "SELECTED" }, { status: "OFFER_RECORDED" }],
      },
    }),
    prisma.application.findMany({
      include: {
        student: { include: { studentProfile: true } },
        placementDrive: { include: { company: true } },
      },
      orderBy: { appliedAt: "desc" },
      take: 5,
    }),
    prisma.placementDrive.findMany({
      where: {
        status: "PUBLISHED",
        deadlineAt: { gte: new Date() },
      },
      include: { company: true },
      orderBy: { deadlineAt: "asc" },
      take: 4,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.application.findMany({
      select: { status: true },
    }),
  ]);

  // Aggregate application funnel counts
  const statusCounts: Record<string, number> = {
    APPLIED: 0,
    UNDER_REVIEW: 0,
    SHORTLISTED: 0,
    ASSESSMENT_SCHEDULED: 0,
    INTERVIEW_SCHEDULED: 0,
    SELECTED: 0,
    OFFER_RECORDED: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };

  allApplications.forEach((app) => {
    if (statusCounts[app.status] !== undefined) {
      statusCounts[app.status]++;
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Cell Console"
        description="Monitor campus recruitment funnels, active drives, corporate partners, and student placement records."
        badge={<Badge variant="warning">Live Database Mode</Badge>}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/reports">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Reports & Export
              </Button>
            </Link>
            <Link href="/admin/drives/new">
              <Button variant="primary" size="sm">
                <Briefcase className="h-4 w-4 mr-1.5" />
                New Drive
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Drives
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-blue-700">{publishedDrivesCount}</span>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Open for student intake</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Registered Candidates
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">{totalStudents}</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Verified student profiles</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Applications
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-indigo-700">{totalApplications}</span>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Across {totalCompanies} corporate partners</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Offers Recorded
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-700">{offersCount}</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Official placements confirmed</span>
          </CardContent>
        </Card>
      </div>

      {/* Recruitment Pipeline Funnel & Approaching Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Application Funnel Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <CardTitle>Recruitment Funnel & Candidate Stages</CardTitle>
              </div>
              <Link
                href="/admin/applicants"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Manage All Applicants →
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="text-slate-500 block">Applied</span>
                  <span className="text-lg font-bold text-blue-800 mt-0.5 block">
                    {statusCounts.APPLIED}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                  <span className="text-slate-500 block">Shortlisted</span>
                  <span className="text-lg font-bold text-purple-800 mt-0.5 block">
                    {statusCounts.SHORTLISTED}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-slate-500 block">Interviews</span>
                  <span className="text-lg font-bold text-amber-800 mt-0.5 block">
                    {statusCounts.INTERVIEW_SCHEDULED + statusCounts.ASSESSMENT_SCHEDULED}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-slate-500 block">Selected / Offers</span>
                  <span className="text-lg font-bold text-emerald-800 mt-0.5 block">
                    {statusCounts.SELECTED + statusCounts.OFFER_RECORDED}
                  </span>
                </div>
              </div>

              {/* Recent Applications table */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Recent Candidate Applications
                </span>
                {recentApplications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No candidate submissions recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-medium">
                          <th className="py-2">Candidate</th>
                          <th className="py-2">Drive</th>
                          <th className="py-2">Date</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentApplications.map((app) => (
                          <tr key={app.id}>
                            <td className="py-2.5 font-semibold text-slate-900">
                              {app.student.name}
                            </td>
                            <td className="py-2.5 text-slate-600">
                              {app.placementDrive.title} ({app.placementDrive.company.name})
                            </td>
                            <td className="py-2.5 text-slate-400">{formatDate(app.appliedAt)}</td>
                            <td className="py-2.5">
                              <ApplicationStatusBadge status={app.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Approaching Deadlines & Audit Trail */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <CardTitle>Approaching Deadlines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {upcomingDrives.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No open drives with future deadlines.</p>
              ) : (
                upcomingDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[180px]">
                        {drive.title}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {formatDate(drive.deadlineAt)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {drive.company.name} • {drive.location || "Campus"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Administrative Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <CardTitle>Recent Admin Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {recentAuditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No administrative actions logged yet.</p>
              ) : (
                recentAuditLogs.map((log) => (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      {log.entityType} #{log.entityId.slice(-6)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
