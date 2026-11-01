"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateTime, formatDateTimeLocal } from "@/lib/utils";
import { Edit2, X, CheckCircle2, AlertCircle, Calendar, Clock } from "lucide-react";

export interface DriveEditData {
  id: string;
  companyId: string;
  title: string;
  jobDescription: string;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryDisplay: string | null;
  deadlineAt: string | Date;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  eligibleBranches: string[];
  eligibleGradYears: number[];
  minimumCgpa: number | null;
  requiredSkills: string[];
  company: {
    id: string;
    name: string;
  };
}

export function EditDriveModal({ drive }: { drive: DriveEditData }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State initialized with existing drive data
  const [title, setTitle] = useState(drive.title);
  const [jobDescription, setJobDescription] = useState(drive.jobDescription);
  const [jobType, setJobType] = useState(drive.jobType || "Full-time");
  const [location, setLocation] = useState(drive.location || "On Campus");
  const [salaryMin, setSalaryMin] = useState(drive.salaryMin !== null ? String(drive.salaryMin) : "");
  const [salaryMax, setSalaryMax] = useState(drive.salaryMax !== null ? String(drive.salaryMax) : "");
  const [salaryDisplay, setSalaryDisplay] = useState(drive.salaryDisplay || "");
  const [deadlineAt, setDeadlineAt] = useState(formatDateTimeLocal(drive.deadlineAt));
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED">(drive.status);
  const [minimumCgpa, setMinimumCgpa] = useState(drive.minimumCgpa !== null ? String(drive.minimumCgpa) : "");

  const handleOpen = () => {
    setTitle(drive.title);
    setJobDescription(drive.jobDescription);
    setJobType(drive.jobType || "Full-time");
    setLocation(drive.location || "On Campus");
    setSalaryMin(drive.salaryMin !== null ? String(drive.salaryMin) : "");
    setSalaryMax(drive.salaryMax !== null ? String(drive.salaryMax) : "");
    setSalaryDisplay(drive.salaryDisplay || "");
    // Always format the stored UTC ISO string into the user's local YYYY-MM-DDTHH:mm
    setDeadlineAt(formatDateTimeLocal(drive.deadlineAt));
    setStatus(drive.status);
    setMinimumCgpa(drive.minimumCgpa !== null ? String(drive.minimumCgpa) : "");
    setFeedback(null);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ type: "error", text: "Job title is required." });
      return;
    }

    if (!deadlineAt) {
      setFeedback({ type: "error", text: "Please enter an application deadline date and time." });
      return;
    }

    const parsedDeadline = new Date(deadlineAt);
    if (isNaN(parsedDeadline.getTime())) {
      setFeedback({ type: "error", text: "Please enter a valid date and time for the application deadline." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/drives/${drive.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: drive.companyId,
          title,
          jobDescription,
          jobType,
          location,
          salaryMin: salaryMin ? parseFloat(salaryMin) : null,
          salaryMax: salaryMax ? parseFloat(salaryMax) : null,
          salaryDisplay: salaryDisplay || null,
          deadlineAt: parsedDeadline.toISOString(),
          status,
          eligibleBranches: drive.eligibleBranches,
          eligibleGradYears: drive.eligibleGradYears,
          minimumCgpa: minimumCgpa ? parseFloat(minimumCgpa) : null,
          requiredSkills: drive.requiredSkills,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.error || "Failed to update placement drive." });
        setLoading(false);
        return;
      }

      setFeedback({ type: "success", text: "Placement drive updated successfully!" });
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 700);
    } catch {
      setFeedback({ type: "error", text: "Network error while saving drive changes." });
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="md" onClick={handleOpen}>
        <Edit2 className="h-4 w-4 mr-1.5" />
        Edit Drive & Deadline
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0e1628] p-6 shadow-2xl border border-[#1e2d4a] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2d4a] mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Edit Placement Drive</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update role details, status, or extend the application deadline for {drive.company.name}.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-4 border ${
                  feedback.type === "success"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                    : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Job Title / Role Name *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                <Select
                  label="Drive Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  options={[
                    { value: "PUBLISHED", label: "Published (Open for Applications)" },
                    { value: "DRAFT", label: "Draft (Hidden from Students)" },
                    { value: "CLOSED", label: "Closed (Submissions Suspended)" },
                    { value: "ARCHIVED", label: "Archived" },
                  ]}
                />
              </div>

              {/* Deadline Date & Time Field with Local Time Support */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Clock className="h-4 w-4" />
                  <span>Application Deadline Configuration</span>
                </div>
                <Input
                  label="Application Deadline Date & Time *"
                  type="datetime-local"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  helperText={
                    deadlineAt && !isNaN(new Date(deadlineAt).getTime())
                      ? `Saved deadline will be: ${formatDateTime(deadlineAt)} (Local Time)`
                      : "Enter or select the date and time when student registrations close"
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Job Type"
                  placeholder="e.g. Full-time, Internship"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                />

                <Input
                  label="Location"
                  placeholder="e.g. Bangalore, Hybrid, Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Min Salary (LPA)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />

                <Input
                  label="Max Salary (LPA)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 18"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />

                <Input
                  label="Min CGPA Cutoff"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.5"
                  value={minimumCgpa}
                  onChange={(e) => setMinimumCgpa(e.target.value)}
                />
              </div>

              <Input
                label="Salary Display Text"
                placeholder="e.g. ₹12.0 - ₹18.0 LPA + Stocks"
                value={salaryDisplay}
                onChange={(e) => setSalaryDisplay(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Job Description & Candidate Requirements *
                </label>
                <textarea
                  className="w-full rounded-lg border border-[#223354] bg-[#0c1322] p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1e2d4a]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
