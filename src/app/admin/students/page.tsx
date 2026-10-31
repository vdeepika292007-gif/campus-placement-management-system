import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { calculateProfileCompleteness } from "@/lib/validation/profile";
import { Users, Search, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string }>;
}) {
  await requireAdmin();
  const { q = "", dept = "" } = await searchParams;

  const whereClause: Record<string, unknown> = {
    role: "STUDENT",
  };

  if (q.trim()) {
    whereClause.OR = [
      { name: { contains: q.trim(), mode: "insensitive" } },
      { email: { contains: q.trim(), mode: "insensitive" } },
    ];
  }

  if (dept.trim()) {
    whereClause.studentProfile = {
      department: dept.trim(),
    };
  }

  const students = await prisma.user.findMany({
    where: whereClause,
    include: {
      studentProfile: true,
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory"
        description="Verified student records, academic profiles, CGPA records, and drive participation."
        badge={
          <Badge variant="default" className="font-semibold">
            {students.length} Registered Students
          </Badge>
        }
      />

      <Card>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No students found"
                description="No registered student profiles match the filter criteria."
                icon={<Users className="h-6 w-6" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Profile Completeness</th>
                    <th className="py-3 px-4">Applications</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const completeness = calculateProfileCompleteness(
                      student.studentProfile || {}
                    );

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[11px] text-slate-500">{student.email}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {student.studentProfile?.studentNumber || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {student.studentProfile?.department || "Unassigned"}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {student.studentProfile?.graduationYear
                            ? `Class of ${student.studentProfile.graduationYear}`
                            : "—"}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {student.studentProfile?.cgpa ? `${student.studentProfile.cgpa} / 10` : "Pending"}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${completeness.percentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">
                              {completeness.percentage}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-blue-700">
                          {student._count.applications} Drives
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge
                            variant={student.accountStatus === "ACTIVE" ? "success" : "warning"}
                          >
                            {student.accountStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
