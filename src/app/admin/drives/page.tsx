"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DriveStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatSalary } from "@/lib/utils";
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DriveItem {
  id: string;
  title: string;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryDisplay: string | null;
  deadlineAt: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  eligibleBranches: string[];
  eligibleGradYears: number[];
  minimumCgpa: number | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  _count?: {
    applications: number;
  };
}

export default function AdminDrivesPage() {
  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDrives();
  }, [search, statusFilter]);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: search,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/drives?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives || []);
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to retrieve placement drives." });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (driveId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/drives/${driveId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: data.message });
        fetchDrives();
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to update status." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error while updating status." });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Drives"
        description="Configure campus recruitment drives, eligibility criteria, deadlines, and multi-stage recruitment rounds."
        actions={
          <Link href="/admin/drives/new">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Placement Drive
            </Button>
          </Link>
        }
      />

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

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

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PUBLISHED", "DRAFT", "CLOSED", "ARCHIVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-white p-5 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : drives.length === 0 ? (
        <EmptyState
          title="No placement drives found"
          description={search ? "No drives match your search query." : "No placement drives have been configured under this filter."}
          actionLabel="Create Placement Drive"
          onAction={() => {
            window.location.href = "/admin/drives/new";
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map((drive) => {
            const isDeadlinePassed = new Date(drive.deadlineAt).getTime() < Date.now();

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
                    <DriveStatusBadge status={drive.status} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-1 flex-1">
                  <div className="text-xs font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>Package:</span>
                    <span className="text-blue-700">
                      {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{drive.location || "Campus / Remote"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className={isDeadlinePassed ? "text-red-600 font-semibold" : ""}>
                        Deadline: {formatDate(drive.deadlineAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {drive._count?.applications || 0}
                      </span>{" "}
                      <span>student applications</span>
                    </div>
                  </div>

                  {drive.minimumCgpa && (
                    <div className="pt-1">
                      <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Min. CGPA: {drive.minimumCgpa}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/admin/drives/${drive.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>Manage Drive</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <div className="flex items-center gap-1">
                    {drive.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusChange(drive.id, "PUBLISHED")}
                      >
                        Publish
                      </Button>
                    )}

                    {drive.status === "PUBLISHED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(drive.id, "CLOSED")}
                      >
                        Close
                      </Button>
                    )}

                    {drive.status === "CLOSED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(drive.id, "PUBLISHED")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
