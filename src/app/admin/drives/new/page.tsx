"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Plus,
  Trash2,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science & AI",
];

const GRAD_YEARS = [2024, 2025, 2026, 2027, 2028];

export default function CreateDrivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCompanyId = searchParams.get("companyId") || "";

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [location, setLocation] = useState("Bangalore (Hybrid)");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryDisplay, setSalaryDisplay] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");

  // Eligibility
  const [eligibleBranches, setEligibleBranches] = useState<string[]>([DEPARTMENTS[0]]);
  const [eligibleGradYears, setEligibleGradYears] = useState<number[]>([2026]);
  const [minimumCgpa, setMinimumCgpa] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Recruitment Stages
  const [rounds, setRounds] = useState<
    { name: string; roundType: "ONLINE_ASSESSMENT" | "TECHNICAL_INTERVIEW" | "HR_INTERVIEW" | "GROUP_DISCUSSION" | "OTHER"; description: string }[]
  >([
    { name: "Online Coding & Aptitude Test", roundType: "ONLINE_ASSESSMENT", description: "Assessment of problem solving, data structures, and aptitude." },
    { name: "Technical Interview", roundType: "TECHNICAL_INTERVIEW", description: "Discussion on system architecture, past projects, and core subjects." },
  ]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/admin/companies?status=active");
        const data = await res.json();
        if (data.success && data.companies) {
          setCompanies(data.companies);
          if (!companyId && data.companies.length > 0) {
            setCompanyId(data.companies[0].id);
          }
        }
      } catch {
        setFeedback({ type: "error", text: "Failed to load active companies." });
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  const handleBranchToggle = (dept: string) => {
    if (eligibleBranches.includes(dept)) {
      if (eligibleBranches.length > 1) {
        setEligibleBranches(eligibleBranches.filter((b) => b !== dept));
      }
    } else {
      setEligibleBranches([...eligibleBranches, dept]);
    }
  };

  const handleYearToggle = (year: number) => {
    if (eligibleGradYears.includes(year)) {
      if (eligibleGradYears.length > 1) {
        setEligibleGradYears(eligibleGradYears.filter((y) => y !== year));
      }
    } else {
      setEligibleGradYears([...eligibleGradYears, year]);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleAddRound = () => {
    setRounds([
      ...rounds,
      {
        name: `Round ${rounds.length + 1}`,
        roundType: "TECHNICAL_INTERVIEW",
        description: "",
      },
    ]);
  };

  const handleRemoveRound = (idx: number) => {
    setRounds(rounds.filter((_, i) => i !== idx));
  };

  const handleSave = async (statusToSet: "DRAFT" | "PUBLISHED") => {
    setFeedback(null);

    if (!companyId) {
      setFeedback({ type: "error", text: "Please select a visiting company." });
      return;
    }
    if (!title.trim()) {
      setFeedback({ type: "error", text: "Please provide a job title/role." });
      return;
    }
    if (!deadlineAt) {
      setFeedback({ type: "error", text: "Please specify an application deadline." });
      return;
    }

    const parsedDeadline = new Date(deadlineAt);
    if (isNaN(parsedDeadline.getTime())) {
      setFeedback({ type: "error", text: "Please enter a valid application deadline date and time." });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          title,
          jobDescription,
          jobType,
          location,
          salaryMin: salaryMin ? parseFloat(salaryMin) : null,
          salaryMax: salaryMax ? parseFloat(salaryMax) : null,
          salaryDisplay: salaryDisplay || null,
          deadlineAt: parsedDeadline.toISOString(),
          status: statusToSet,
          eligibleBranches,
          eligibleGradYears,
          minimumCgpa: minimumCgpa ? parseFloat(minimumCgpa) : null,
          requiredSkills: skills,
          recruitmentRounds: rounds.map((r, idx) => ({
            name: r.name,
            roundType: r.roundType,
            sequence: idx + 1,
            description: r.description || null,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.error || "Failed to create placement drive." });
        setSubmitting(false);
        return;
      }

      router.push("/admin/drives");
      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "Network error occurred." });
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
        title="Create Placement Drive"
        description="Configure role requirements, compensation, branch eligibility criteria, and multi-stage interview rounds."
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

      {/* Section 1: Company and Role */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <CardTitle>1. Visiting Company & Role Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Company *</label>
              {loadingCompanies ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : companies.length === 0 ? (
                <div className="text-xs text-red-600">
                  No active companies found. Please{" "}
                  <Link href="/admin/companies" className="underline font-bold">
                    add a company first
                  </Link>
                  .
                </div>
              ) : (
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Input
              label="Role Title / Designation *"
              placeholder="e.g. Associate Software Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              <option value="Full-time">Full-time (FTE)</option>
              <option value="Internship + FTE">6-Month Internship + FTE</option>
              <option value="Summer Internship">Summer Internship Only</option>
            </Select>

            <Input
              label="Job Location"
              placeholder="e.g. Bangalore (Hybrid), Noida, Pune"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Job Description & Responsibilities *</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 min-h-24"
              placeholder="Provide role requirements, day-to-day responsibilities, tech stack, and benefits..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
              placeholder="e.g. 16.5"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />

            <Input
              label="Package Display Text (Optional)"
              placeholder="e.g. ₹12.0 - ₹16.5 LPA + Retention Bonus"
              value={salaryDisplay}
              onChange={(e) => setSalaryDisplay(e.target.value)}
            />
          </div>

          <div className="pt-1">
            <Input
              label="Application Deadline Date & Time *"
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              helperText={
                deadlineAt && !isNaN(new Date(deadlineAt).getTime())
                  ? `Scheduled closing: ${formatDateTime(deadlineAt)} (Local Time)`
                  : "Specify the exact deadline date and time for student registrations"
              }
              required
            />

          </div>
        </CardContent>
      </Card>

      {/* Section 2: Eligibility Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-indigo-600" />
            <CardTitle>2. Eligibility Criteria (Configurable Rules)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Eligible Academic Departments / Branches *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEPARTMENTS.map((dept) => {
                const checked = eligibleBranches.includes(dept);
                return (
                  <label
                    key={dept}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked
                        ? "bg-blue-50/70 border-blue-200 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleBranchToggle(dept)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{dept}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700">
              Eligible Graduation Batches *
            </label>
            <div className="flex flex-wrap gap-2">
              {GRAD_YEARS.map((year) => {
                const checked = eligibleGradYears.includes(year);
                return (
                  <label
                    key={year}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      checked
                        ? "bg-blue-50/70 border-blue-200 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleYearToggle(year)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Class of {year}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-1">
            <Input
              label="Minimum Required CGPA (Scale of 10.0)"
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g. 7.5 (leave empty if no cutoff)"
              value={minimumCgpa}
              onChange={(e) => setMinimumCgpa(e.target.value)}
              helperText="Students below this CGPA cutoff will see an explanatory ineligibility reason."
            />
          </div>

          {/* Required Skills */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700">Recommended / Required Skills</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill (e.g. React, SQL, Python) and press Enter"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
              />
              <Button type="button" variant="secondary" onClick={handleAddSkill}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((s) => s !== skill))}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Recruitment Stages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <CardTitle>3. Recruitment Rounds & Pipeline</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddRound}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Round
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rounds.map((round, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">Stage {index + 1}</span>
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRound(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove round"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Round Title *"
                  value={round.name}
                  onChange={(e) => {
                    const updated = [...rounds];
                    updated[index].name = e.target.value;
                    setRounds(updated);
                  }}
                  required
                />

                <Select
                  label="Round Type"
                  value={round.roundType}
                  onChange={(e) => {
                    const updated = [...rounds];
                    updated[index].roundType = e.target.value as any;
                    setRounds(updated);
                  }}
                >
                  <option value="ONLINE_ASSESSMENT">Online Assessment / Aptitude</option>
                  <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
                  <option value="HR_INTERVIEW">HR Interview</option>
                  <option value="GROUP_DISCUSSION">Group Discussion</option>
                  <option value="OTHER">Other Evaluation</option>
                </Select>
              </div>

              <Input
                label="Instructions / Description (Optional)"
                placeholder="e.g. 60-minute coding challenge on HackerRank"
                value={round.description}
                onChange={(e) => {
                  const updated = [...rounds];
                  updated[index].description = e.target.value;
                  setRounds(updated);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          isLoading={submitting}
          onClick={() => handleSave("DRAFT")}
        >
          Save as Draft
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={submitting}
          onClick={() => handleSave("PUBLISHED")}
        >
          Publish Drive
        </Button>
      </div>
    </div>
  );
}
