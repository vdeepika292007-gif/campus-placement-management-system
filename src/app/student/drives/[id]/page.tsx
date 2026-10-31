"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EligibilityBadge } from "@/components/ui/EligibilityBadge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatSalary } from "@/lib/utils";
import { evaluateEligibility, EligibilityResult } from "@/lib/eligibility/engine";
import {
  Building2,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function StudentDriveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [drive, setDrive] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDrive();
  }, [id]);

  const fetchDrive = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/drives/${id}`);
      const data = await res.json();
      if (data.success) {
        setDrive(data.drive);
        setApplication(data.application);
        setStudentProfile(data.studentProfile);
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to load drive details." });
      }
    } catch {
      setFeedback({ type: "error", text: "Network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/student/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementDriveId: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: "error", text: data.error || "Application submission rejected." });
        setApplying(false);
        return;
      }

      setFeedback({
        type: "success",
        text: "Application submitted successfully! Track your recruitment stages under 'My Applications'.",
      });
      fetchDrive();
    } catch {
      setFeedback({ type: "error", text: "Network error submitting application." });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="space-y-4">
        <Link href="/student/drives" className="text-xs text-blue-600">
          ← Back to drives
        </Link>
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">Drive details unavailable.</p>
        </div>
      </div>
    );
  }

  const eligibility: EligibilityResult = evaluateEligibility(studentProfile, {
    eligibleBranches: drive.eligibleBranches,
    eligibleGradYears: drive.eligibleGradYears,
    minimumCgpa: drive.minimumCgpa,
    requiredSkills: drive.requiredSkills,
  });

  const isExpired = new Date(drive.deadlineAt).getTime() < Date.now();
  const canSubmit = eligibility.canApply && !application && !isExpired;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link
          href="/student/drives"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Drives</span>
        </Link>
      </div>

      <PageHeader
        title={drive.title}
        description={`${drive.company.name} • ${drive.location || "Campus Drive"}`}
        badge={
          application ? (
            <ApplicationStatusBadge status={application.status} />
          ) : isExpired ? (
            <Badge variant="neutral">Closed</Badge>
          ) : (
            <EligibilityBadge status={eligibility.status} />
          )
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

      {/* Role & Compensation Summary */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Compensation</span>
              <span className="font-bold text-blue-700 text-sm mt-0.5 block">
                {formatSalary(drive.salaryMin, drive.salaryMax, drive.salaryDisplay)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Job Location</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {drive.location || "On Campus"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Employment Type</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {drive.jobType || "Full-time"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Application Deadline</span>
              <span
                className={`font-semibold mt-0.5 block ${
                  isExpired ? "text-red-600 font-bold" : "text-slate-800"
                }`}
              >
                {formatDate(drive.deadlineAt)}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Role Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {drive.jobDescription}
            </p>
          </div>

          {drive.company.website && (
            <div className="pt-2 border-t border-slate-100">
              <a
                href={drive.company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>About {drive.company.name}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanatory Eligibility Checklist */}
      <Card className="border-blue-200/80">
        <CardHeader className="bg-blue-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <CardTitle>Eligibility Explanation & Criteria Checklist</CardTitle>
            </div>
            <EligibilityBadge status={eligibility.status} />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-xs text-slate-600">{eligibility.summary}</p>

          <div className="space-y-3">
            {eligibility.checks.map((check, i) => {
              const isMet = check.passed === true;
              const isMissing = check.passed === null;

              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                    isMet
                      ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                      : isMissing
                      ? "bg-amber-50/60 border-amber-200/80 text-amber-900"
                      : "bg-red-50/60 border-red-200/80 text-red-900"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isMet ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isMissing ? (
                      <HelpCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{check.title}</span>
                      <span className="text-[11px] font-semibold opacity-80">
                        {isMet ? "Requirement Met" : isMissing ? "Action Needed" : "Not Met"}
                      </span>
                    </div>

                    <p className="text-[11px] opacity-90">{check.reason}</p>

                    <div className="pt-1 text-[10px] opacity-75 flex flex-wrap gap-x-4">
                      <span>Requirement: {check.requiredValue}</span>
                      <span>Your Record: {check.studentValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {eligibility.status === "INCOMPLETE_PROFILE" && (
            <div className="pt-2">
              <Link href="/student/profile">
                <Button variant="outline" size="sm">
                  Complete Your Profile to Qualify
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recruitment Pipeline */}
      {drive.recruitmentRounds && drive.recruitmentRounds.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-600" />
              <CardTitle>Recruitment Stages ({drive.recruitmentRounds.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {drive.recruitmentRounds.map((round: any, idx: number) => (
              <div
                key={round.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{round.name}</h4>
                  <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                    {round.roundType.toLowerCase().replace(/_/g, " ")}
                  </p>
                  {round.description && (
                    <p className="text-xs text-slate-600 mt-1">{round.description}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Application Action Card */}
      <Card className="bg-slate-900 text-white border-slate-800">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Ready to Apply?</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {application
                ? "You have already submitted an application for this drive. Check your status history."
                : isExpired
                ? "This recruitment drive has closed its application window."
                : eligibility.canApply
                ? "You meet all configured eligibility criteria. Your registered profile will be sent to the placement coordinator."
                : "Review the eligibility checklist above to see which requirements are not met or incomplete."}
            </p>
          </div>

          <div>
            {application ? (
              <Link href="/student/applications">
                <Button variant="secondary" size="lg">
                  View in My Applications
                </Button>
              </Link>
            ) : isExpired ? (
              <Button disabled variant="secondary" size="lg">
                Application Closed
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={!canSubmit}
                isLoading={applying}
                onClick={handleApply}
                className="font-bold px-8 shadow-md"
              >
                Submit Application
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
