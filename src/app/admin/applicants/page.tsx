"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  X,
  History,
} from "lucide-react";

const APPLICATION_STATUSES = [
  "APPLIED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ASSESSMENT_SCHEDULED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "OFFER_RECORDED",
  "REJECTED",
  "WITHDRAWN",
];

export default function AdminApplicantsPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [drives, setDrives] = useState<{ id: string; title: string; company: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDriveId, setSelectedDriveId] = useState("");

  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState("SHORTLISTED");
  const [statusReason, setStatusReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [search, statusFilter, selectedDriveId]);

  const fetchDrives = async () => {
    try {
      const res = await fetch("/api/admin/drives");
      const data = await res.json();
      if (data.success) {
        setDrives(data.drives || []);
      }
    } catch (err) {
      console.error("Error loading drives:", err);
    }
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: search,
        status: statusFilter,
        driveId: selectedDriveId,
      });
      const res = await fetch(`/api/admin/applicants?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applications || []);
      }
    } catch {
      setFeedback({ type: "error", text: "Failed to load candidate applications." });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (app: any) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusReason("");
    setFeedback(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/applicants/${selectedApp.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.error || "Failed to update status." });
        setUpdating(false);
        return;
      }

      setSelectedApp(null);
      setFeedback({ type: "success", text: "Application status updated and student notified." });
      fetchApplicants();
    } catch {
      setFeedback({ type: "error", text: "Network error updating status." });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Applicants"
        description="Review student applications, manage recruitment round outcomes, and update selection statuses."
        badge={
          <Badge variant="default" className="font-semibold">
            {applicants.length} Candidate Records
          </Badge>
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
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, email, branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDriveId}
            onChange={(e) => setSelectedDriveId(e.target.value)}
            className="p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 max-w-xs"
          >
            <option value="">All Placement Drives</option>
            {drives.map((d) => (
              <option key={d.id} value={d.id}>
                {d.company.name} — {d.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="ALL">All Application Statuses</option>
            {APPLICATION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applicants Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading candidate records...</div>
          ) : applicants.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No applicant records found"
                description={
                  search || selectedDriveId || statusFilter !== "ALL"
                    ? "Try adjusting your search or filters."
                    : "No student applications have been received yet."
                }
                icon={<Users className="h-6 w-6" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Department & Batch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Placement Drive</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{app.student.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{app.student.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{app.student.studentProfile?.department || "N/A"}</div>
                        <div className="text-[11px] text-slate-500">
                          Class of {app.student.studentProfile?.graduationYear || "N/A"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {app.student.studentProfile?.cgpa ? `${app.student.studentProfile.cgpa} / 10` : "Pending"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{app.placementDrive.title}</div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {app.placementDrive.company.name}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(app.appliedAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        <ApplicationStatusBadge status={app.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenStatusModal(app)}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Update Candidate Status</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Student: </span>
                  <span className="font-bold text-slate-900">{selectedApp.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Drive: </span>
                  <span className="font-medium text-slate-800">
                    {selectedApp.placementDrive.title} ({selectedApp.placementDrive.company.name})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Current Status: </span>
                  <span className="font-semibold text-blue-700">{selectedApp.status}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">New Recruitment Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                >
                  {APPLICATION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Status Change Reason / Notes (Visible to Student)
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 min-h-20"
                  placeholder="e.g. Cleared Round 1 Coding Test with 92% score. Invited to Technical Interview."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedApp(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={updating}>
                  Save & Notify Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
