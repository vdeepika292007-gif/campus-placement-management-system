import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, formatSalary } from "@/lib/utils";
import { evaluateEligibility } from "@/lib/eligibility/engine";
import {
  Briefcase,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bell,
  Award,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await requireStudent();

  // 1. Fetch student user, profile, and applications
  const studentUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      studentProfile: true,
      applications: {
        include: {
          placementDrive: {
            include: { company: true },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  const profile = studentUser?.studentProfile;
  const applications = studentUser?.applications || [];

  // 2. Fetch active published drives
  const publishedDrives = await prisma.placementDrive.findMany({
    where: { status: "PUBLISHED" },
    include: { company: true },
    orderBy: { deadlineAt: "asc" },
  });

  // Calculate live counts
  const totalApplied = applications.length;
  const shortlistedCount = applications.filter(
    (a) =>
      a.status === "SHORTLISTED" ||
      a.status === "ASSESSMENT_SCHEDULED" ||
      a.status === "INTERVIEW_SCHEDULED"
  ).length;
  const offersCount = applications.filter(
    (a) => a.status === "SELECTED" || a.status === "OFFER_RECORDED"
  ).length;

  // Calculate eligible open drives
  const eligibleDrives = publishedDrives.filter((drive) => {
    const isExpired = new Date(drive.deadlineAt).getTime() < Date.now();
    if (isExpired) return false;
    const res = evaluateEligibility(profile, {
      eligibleBranches: drive.eligibleBranches,
      eligibleGradYears: drive.eligibleGradYears,
      minimumCgpa: drive.minimumCgpa,
      requiredSkills: drive.requiredSkills,
    });
    return res.status === "ELIGIBLE";
  });

  // Fetch recent notifications
  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${session.name.split(" ")[0]}`}
        description="Welcome to your campus placement portal. Monitor active opportunities and application outcomes."
        badge={
          offersCount > 0 ? (
            <Badge variant="success" className="font-semibold">
              Offer Recorded 🎉
            </Badge>
          ) : (
            <Badge variant="default">Academic Year 2025-26</Badge>
          )
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Eligible Open Drives
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-blue-700">{eligibleDrives.length}</span>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Based on your academic profile</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Applications Submitted
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">{totalApplied}</span>
              <FileCheck2 className="h-4 w-4 text-slate-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Across visiting companies</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Interviews / Shortlisted
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-purple-700">{shortlistedCount}</span>
              <Clock className="h-4 w-4 text-purple-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Active recruitment stages</span>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Offers Received
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-700">{offersCount}</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400 block">Verified placement selections</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections: Eligible Drives & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Drives */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <CardTitle>Recommended Open Drives</CardTitle>
              </div>
              <Link
                href="/student/drives"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {publishedDrives.length === 0 ? (
                <EmptyState
                  title="No active placement drives"
                  description="Placement administrators will publish new visiting company drives soon."
                />
              ) : (
                publishedDrives.slice(0, 3).map((drive) => {
                  const applied = applications.find((a) => a.placementDriveId === drive.id);

                  return (
                    <div
                      key={drive.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                          {drive.company.name}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{drive.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>
                            {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)}
                          </span>
                          <span>•</span>
                          <span>Deadline: {formatDateTime(drive.deadlineAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {applied ? (
                          <ApplicationStatusBadge status={applied.status} />
                        ) : (
                          <Link href={`/student/drives/${drive.id}`}>
                            <Button size="sm" variant="primary">
                              Details & Apply
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Applications List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <CardTitle>My Recent Applications</CardTitle>
              </div>
              <Link
                href="/student/applications"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {applications.length === 0 ? (
                <EmptyState
                  title="No applications submitted"
                  description="When you apply to placement drives, your progress and interview calls will appear here."
                  actionLabel="Browse Drives"
                  onAction={() => {}}
                />
              ) : (
                applications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {app.placementDrive.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {app.placementDrive.company.name} • Applied {formatDate(app.appliedAt)}
                      </p>
                    </div>

                    <ApplicationStatusBadge status={app.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profile Status & Notifications */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-blue-950 text-white border-0">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Academic Record
                </span>
                <Badge variant="default" className="bg-blue-600/30 text-blue-200 border-blue-400/30">
                  {profile?.graduationYear ? `Class of ${profile.graduationYear}` : "Profile Pending"}
                </Badge>
              </div>

              <div>
                <h3 className="text-base font-bold">{session.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {profile?.department || "Department not set"}
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-400">
                  CGPA: {profile?.cgpa ? `${profile.cgpa} / 10.0` : "Not recorded"}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/student/profile">
                  <Button size="sm" variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20">
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600" />
                <CardTitle>Announcements</CardTitle>
              </div>
              <Link
                href="/student/notifications"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {recentNotifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No notifications yet.</p>
              ) : (
                recentNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{notif.title}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(notif.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600">{notif.message}</p>
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
