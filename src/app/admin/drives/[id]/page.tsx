import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DriveStatusBadge, ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, formatSalary } from "@/lib/utils";
import { EditDriveModal } from "@/components/admin/EditDriveModal";
import {
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Users,
  Layers,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDriveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const drive = await prisma.placementDrive.findUnique({
    where: { id },
    include: {
      company: true,
      recruitmentRounds: {
        orderBy: { sequence: "asc" },
      },
      applications: {
        include: {
          student: {
            include: { studentProfile: true },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!drive) {
    notFound();
  }

  const isExpired = new Date(drive.deadlineAt).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/drives"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Drives</span>
        </Link>
      </div>

      <PageHeader
        title={drive.title}
        description={`Placement Drive for ${drive.company.name}`}
        badge={<DriveStatusBadge status={drive.status} />}
        actions={<EditDriveModal drive={drive} />}
      />

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Role Description & Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {drive.jobDescription}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Package</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {drive.location || "On Campus"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Job Type</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {drive.jobType || "Full-time"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Deadline</span>
                <span className={`font-semibold mt-0.5 block ${isExpired ? "text-red-600 font-bold" : "text-slate-800"}`}>
                  {formatDateTime(drive.deadlineAt)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Min. CGPA Cutoff</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {drive.minimumCgpa ? `${drive.minimumCgpa} / 10.0` : "No CGPA cutoff"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Total Applicants</span>
                <span className="font-bold text-blue-700 mt-0.5 block">
                  {drive.applications.length} Students
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility & Rounds Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eligible Branches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {drive.eligibleBranches.map((branch) => (
                  <Badge key={branch} variant="default">
                    {branch}
                  </Badge>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Batches: </span>
                {drive.eligibleGradYears.map((y) => `Class of ${y}`).join(", ")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recruitment Stages ({drive.recruitmentRounds.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {drive.recruitmentRounds.length === 0 ? (
                <p className="text-xs text-slate-400">No rounds defined.</p>
              ) : (
                drive.recruitmentRounds.map((round) => (
                  <div key={round.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-semibold text-slate-900">{round.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize mt-0.5">
                      {round.roundType.toLowerCase().replace(/_/g, " ")}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Applicants List Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registered Applicants ({drive.applications.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {drive.applications.length === 0 ? (
            <EmptyState
              title="No applications submitted yet"
              description="Students meeting the eligibility criteria can apply while this drive is published."
              icon={<Users className="h-6 w-6" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Application Date</th>
                    <th className="py-3 px-4">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drive.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {app.student.name}
                        <span className="block text-[11px] text-slate-500 font-normal">
                          {app.student.email}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {app.student.studentProfile?.department || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {app.student.studentProfile?.graduationYear || "N/A"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {app.student.studentProfile?.cgpa ? `${app.student.studentProfile.cgpa} / 10` : "Pending"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td className="py-3 px-4">
                        <ApplicationStatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
