"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApplicationStatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, formatSalary } from "@/lib/utils";
import {
  FileCheck2,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  Briefcase,
  History,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface StatusLog {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string;
}

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  placementDrive: {
    id: string;
    title: string;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryDisplay: string | null;
    company: {
      name: string;
      website: string | null;
    };
  };
  statusLogs: StatusLog[];
}

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="My Applications"
        description="Track your active recruitment applications, interview schedules, and stage-by-stage progression."
        badge={
          <Badge variant="default" className="font-semibold">
            {applications.length} Submitted
          </Badge>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-white p-6 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications submitted yet"
          description="Browse published placement drives to check your eligibility and apply."
          actionLabel="Explore Open Drives"
          onAction={() => {
            window.location.href = "/student/drives";
          }}
          icon={<FileCheck2 className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;

            return (
              <Card key={app.id} className="transition-all">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                        {app.placementDrive.company.name}
                      </span>
                      <CardTitle className="text-base font-bold text-slate-900 mt-0.5">
                        {app.placementDrive.title}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-3">
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 py-1">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Package: </span>
                      <span className="font-semibold text-slate-800">
                        {formatSalary(
                          app.placementDrive.salaryMin,
                          app.placementDrive.salaryMax,
                          app.placementDrive.salaryDisplay
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span className="font-medium text-slate-700">
                        {app.placementDrive.location || "On Campus"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Applied on {formatDate(app.appliedAt)}</span>
                    </div>
                  </div>

                  {/* Expandable Timeline Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-slate-50/70 p-4 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <History className="h-4 w-4 text-blue-600" />
                        <span>Recruitment Status History</span>
                      </div>

                      {app.statusLogs.length === 0 ? (
                        <p className="text-xs text-slate-400">No status changes recorded yet.</p>
                      ) : (
                        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {app.statusLogs.map((log) => (
                            <div key={log.id} className="relative text-xs space-y-0.5">
                              <span className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">
                                  {log.toStatus.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDateTime(log.createdAt)}
                                </span>
                              </div>
                              {log.reason && (
                                <p className="text-xs text-slate-600">{log.reason}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(app.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <span>{isExpanded ? "Hide Status Timeline" : "View Status Timeline"}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <Link
                    href={`/student/drives/${app.placementDrive.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>View Drive Terms</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
