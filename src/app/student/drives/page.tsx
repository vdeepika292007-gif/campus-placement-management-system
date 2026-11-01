"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EligibilityBadge, EligibilityStatus } from "@/components/ui/EligibilityBadge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, formatSalary } from "@/lib/utils";
import {
  Briefcase,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";

interface StudentDriveItem {
  id: string;
  title: string;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryDisplay: string | null;
  deadlineAt: string;
  eligibleBranches: string[];
  eligibleGradYears: number[];
  minimumCgpa: number | null;
  requiredSkills: string[];
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  isApplied: boolean;
  applicationStatus: string | null;
  isExpired: boolean;
}

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<StudentDriveItem[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  useEffect(() => {
    fetchDrives();
  }, [search, branchFilter]);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: search,
        branch: branchFilter,
      });
      const res = await fetch(`/api/student/drives?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives || []);
        setStudentProfile(data.studentProfile);
      }
    } catch (err) {
      console.error("Failed to load drives:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine quick status on card
  const getEligibilityQuickStatus = (drive: StudentDriveItem): EligibilityStatus => {
    if (!studentProfile || !studentProfile.department || !studentProfile.graduationYear) {
      return "INCOMPLETE_PROFILE";
    }

    const branchMatch = drive.eligibleBranches.includes(studentProfile.department);
    const yearMatch = drive.eligibleGradYears.includes(studentProfile.graduationYear);
    const cgpaMatch =
      drive.minimumCgpa === null ||
      (studentProfile.cgpa !== null && studentProfile.cgpa >= drive.minimumCgpa);

    if (branchMatch && yearMatch && cgpaMatch) {
      return "ELIGIBLE";
    }
    return "NOT_ELIGIBLE";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Drives"
        description="Explore active recruitment opportunities posted by visiting companies."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by role, company, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full sm:w-64 p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Academic Branches</option>
            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication Engineering">
              Electronics & Communication Engineering
            </option>
            <option value="Electrical & Electronics Engineering">
              Electrical & Electronics Engineering
            </option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-60 rounded-xl bg-white p-5 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <EmptyState
          title="No open placement drives found"
          description={search || branchFilter ? "Try adjusting your search criteria." : "There are currently no published placement drives accepting applications."}
          icon={<Briefcase className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => {
            const eligibilityStatus = getEligibilityQuickStatus(drive);

            return (
              <Card key={drive.id} className="flex flex-col justify-between card-interactive">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 block uppercase tracking-wider">
                        {drive.company.name}
                      </span>
                      <CardTitle className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">
                        {drive.title}
                      </CardTitle>
                    </div>

                    {drive.isApplied ? (
                      <ApplicationStatusBadge status={drive.applicationStatus || "APPLIED"} />
                    ) : drive.isExpired ? (
                      <Badge variant="neutral">Closed</Badge>
                    ) : (
                      <EligibilityBadge status={eligibilityStatus} />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-1 flex-1">
                  <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>Package:</span>
                    <span className="text-blue-700 font-bold">
                      {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{drive.location || "On Campus"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className={drive.isExpired ? "text-red-600 font-semibold" : ""}>
                        {drive.isExpired ? "Deadline Expired" : `Deadline: ${formatDateTime(drive.deadlineAt)}`}
                      </span>
                    </div>
                  </div>

                  {drive.minimumCgpa && (
                    <div className="pt-1">
                      <span className="inline-block text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Min. CGPA: {drive.minimumCgpa}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/student/drives/${drive.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>Check Details & Apply</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  {drive.isApplied && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Already Applied
                    </span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
