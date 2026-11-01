"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DepartmentChart,
  StatusBreakdownChart,
  CompanyPerformanceChart,
  DriveStatusChart,
  PlacementTimelineChart,
} from "./AnalyticsCharts";
import {
  Users,
  Briefcase,
  Building2,
  Award,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface AnalyticsResponse {
  success: boolean;
  filters: {
    year: string;
    department: string;
    companyId: string;
    driveStatus: string;
  };
  availableFilters: {
    years: number[];
    departments: string[];
    companies: { id: string; name: string }[];
    driveStatuses: string[];
  };
  summary: {
    totalStudents: number;
    totalCompanies: number;
    totalDrives: number;
    totalApplications: number;
    totalOffers: number;
    uniquePlacedStudents: number;
    placementRate: number;
    formula: string;
  };
  charts: {
    studentsByDepartment: { department: string; count: number; percentage: number }[];
    applicationsByStatus: { status: string; label: string; count: number; percentage: number; color: string }[];
    companyPerformance: { companyId: string; name: string; applications: number; offers: number; conversionRate: number }[];
    drivesByStatus: { status: string; label: string; count: number; color: string }[];
    timeline: { date: string; displayDate: string; applications: number; offers: number }[];
  };
  reportsTable: {
    id: string;
    title: string;
    companyName: string;
    companyId: string;
    status: string;
    jobType: string;
    eligibleBranches: string[];
    deadlineAt: string;
    totalApplicants: number;
    shortlistedCount: number;
    selectedCount: number;
    offersCount: number;
    totalOffers: number;
    conversionRate: number;
  }[];
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active filter state
  const [year, setYear] = useState<string>("ALL");
  const [department, setDepartment] = useState<string>("ALL");
  const [companyId, setCompanyId] = useState<string>("ALL");
  const [driveStatus, setDriveStatus] = useState<string>("ALL");

  // Local table search query
  const [tableSearch, setTableSearch] = useState<string>("");

  const searchInputId = useId();

  // Fetch analytics data from the database through the API pattern
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (year !== "ALL") params.set("year", year);
      if (department !== "ALL") params.set("department", department);
      if (companyId !== "ALL") params.set("companyId", companyId);
      if (driveStatus !== "ALL") params.set("driveStatus", driveStatus);

      const res = await fetch(`/api/admin/reports/analytics?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load analytics: Server responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to load placement analytics.");
      }

      setData(json);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "An unexpected error occurred while loading analytics.");
    } finally {
      setLoading(false);
    }
  }, [year, department, companyId, driveStatus]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleResetFilters = () => {
    setYear("ALL");
    setDepartment("ALL");
    setCompanyId("ALL");
    setDriveStatus("ALL");
    setTableSearch("");
  };

  const hasActiveFilters =
    year !== "ALL" || department !== "ALL" || companyId !== "ALL" || driveStatus !== "ALL";

  // Build export URL with active filters
  const getExportUrl = (driveId?: string) => {
    const params = new URLSearchParams();
    if (driveId) {
      params.set("driveId", driveId);
    } else {
      if (year !== "ALL") params.set("year", year);
      if (department !== "ALL") params.set("department", department);
      if (companyId !== "ALL") params.set("companyId", companyId);
      if (driveStatus !== "ALL") params.set("driveStatus", driveStatus);
    }
    return `/api/admin/reports/export?${params.toString()}`;
  };

  // Filter table rows by search query
  const filteredTableRows = data?.reportsTable.filter((row) => {
    if (!tableSearch.trim()) return true;
    const q = tableSearch.toLowerCase();
    return (
      row.title.toLowerCase().includes(q) ||
      row.companyName.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* 1. Metric Definitions & Placement Rate Integrity Alert */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-start gap-3 shadow-sm">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white flex items-center gap-2">
            <span>Verified Metric Integrity & Placement Rate Formula</span>
            <Badge variant="default" className="text-[10px] bg-blue-600/30 text-blue-300 border-blue-500/40">
              Live Database
            </Badge>
          </p>
          <p className="text-slate-300 leading-relaxed">
            All metrics are calculated directly from persistent records. The placement rate is rigorously calculated as:{" "}
            <strong className="text-white font-mono bg-[#0c1322] px-2 py-0.5 rounded border border-[#223354]">
              (Unique Placed Students ÷ Total Candidates) × 100
            </strong>
            . Duplicate applications and multiple offers secured by a single student are counted toward total offers, but counted exactly once for placement rate to ensure academic integrity.
          </p>
        </div>
      </div>

      {/* 2. Interactive Filters Toolbar */}
      <Card className="bg-[#111a2e] border-[#1e2d4a]">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#1a2742] pb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Filter className="h-4 w-4 text-blue-400" />
                <span>Filter Analytics & Reports</span>
                {hasActiveFilters && (
                  <Badge variant="info" className="text-[10px]">
                    Active Filters
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs text-slate-400 hover:text-white h-7 px-2"
                  >
                    Reset Filters
                  </Button>
                )}
                <a href={getExportUrl()} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="sm" className="h-7 text-xs flex items-center gap-1.5 shadow-sm">
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Graduation Batch / Academic Year */}
              <Select
                label="Graduation Batch"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
              >
                <option value="ALL">All Academic Batches</option>
                {data?.availableFilters.years.map((y) => (
                  <option key={y} value={y.toString()}>
                    Class of {y}
                  </option>
                ))}
              </Select>

              {/* Department */}
              <Select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
              >
                <option value="ALL">All Academic Departments</option>
                {data?.availableFilters.departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>

              {/* Corporate Partner / Company */}
              <Select
                label="Corporate Partner"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={loading}
              >
                <option value="ALL">All Companies</option>
                {data?.availableFilters.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>

              {/* Drive Status */}
              <Select
                label="Placement Drive Status"
                value={driveStatus}
                onChange={(e) => setDriveStatus(e.target.value)}
                disabled={loading}
              >
                <option value="ALL">All Drive Statuses</option>
                <option value="PUBLISHED">Published / Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* 4. Loading Skeleton State */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-[#111a2e] border border-[#1e2d4a] animate-pulse p-4" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-xl bg-[#111a2e] border border-[#1e2d4a] animate-pulse" />
            <div className="h-64 rounded-xl bg-[#111a2e] border border-[#1e2d4a] animate-pulse" />
          </div>
        </div>
      )}

      {/* 5. Summary KPI Cards (6 Key Metrics) */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5" id="summary-cards-grid">
          {/* Candidates */}
          <Card className="hover:border-blue-500/50 transition-all">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Students
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white">{data.summary.totalStudents}</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {year !== "ALL" ? `Batch ${year}` : "All batches"}
              </span>
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="hover:border-indigo-500/50 transition-all">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Companies
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-indigo-400">{data.summary.totalCompanies}</span>
                <Building2 className="h-4 w-4 text-indigo-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">Corporate partners</span>
            </CardContent>
          </Card>

          {/* Placement Drives */}
          <Card className="hover:border-purple-500/50 transition-all">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Placement Drives
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-purple-400">{data.summary.totalDrives}</span>
                <Briefcase className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {driveStatus !== "ALL" ? driveStatus : "Total configured"}
              </span>
            </CardContent>
          </Card>

          {/* Applications */}
          <Card className="hover:border-cyan-500/50 transition-all">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Applications
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-cyan-400">{data.summary.totalApplications}</span>
                <Layers className="h-4 w-4 text-cyan-400" />
              </div>
              <span className="text-[10px] text-slate-400 block">Total submissions</span>
            </CardContent>
          </Card>

          {/* Offers Recorded */}
          <Card className="hover:border-emerald-500/50 transition-all">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Offers Recorded
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-emerald-400">{data.summary.totalOffers}</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-300 font-semibold block truncate">
                {data.summary.uniquePlacedStudents} Unique Placed
              </span>
            </CardContent>
          </Card>

          {/* Placement Rate */}
          <Card className="hover:border-amber-500/50 transition-all bg-gradient-to-br from-[#111a2e] to-[#15233e]">
            <CardContent className="p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                Placement Rate
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-amber-400">{data.summary.placementRate}%</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {data.summary.uniquePlacedStudents}/{data.summary.totalStudents} placed
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 6. Charts Grid */}
      {data && (
        <div className="space-y-6">
          {/* Row 1: Students by Department & Applications by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Students by Department */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <CardTitle>Students by Department</CardTitle>
                </div>
                <Badge variant="neutral" className="text-[11px]">
                  {data.charts.studentsByDepartment.length} Branches
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <DepartmentChart data={data.charts.studentsByDepartment} />
              </CardContent>
            </Card>

            {/* Chart: Applications by Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <CardTitle>Applications by Status</CardTitle>
                </div>
                <Badge variant="neutral" className="text-[11px]">
                  {data.summary.totalApplications} Total
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <StatusBreakdownChart data={data.charts.applicationsByStatus} />
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Applications & Offers by Company & Drives by Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Applications and Offers by Company */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-400" />
                  <CardTitle>Applications & Offers by Company</CardTitle>
                </div>
                <span className="text-xs text-slate-400">Top Recruiters</span>
              </CardHeader>
              <CardContent className="pt-2">
                <CompanyPerformanceChart data={data.charts.companyPerformance} />
              </CardContent>
            </Card>

            {/* Chart: Placement Drives by Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-400" />
                  <CardTitle>Placement Drives by Status</CardTitle>
                </div>
                <Badge variant="neutral" className="text-[11px]">
                  {data.summary.totalDrives} Drives
                </Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <DriveStatusChart data={data.charts.drivesByStatus} />
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Placement Outcomes Over Time (Timeline) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <CardTitle>Placement Outcomes Over Time</CardTitle>
              </div>
              <span className="text-xs text-slate-400">Intake & Selection Activity</span>
            </CardHeader>
            <CardContent className="pt-2">
              <PlacementTimelineChart data={data.charts.timeline} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* 7. Reports Area: Detailed Drive Metrics Table & CSV Export */}
      {data && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#1a2742]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-400" />
                  <span>Key Placement Performance Metrics & Drive Audit</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Comprehensive conversion statistics and applicant outcomes across all recruitment drives.
                </CardDescription>
              </div>

              {/* Table search filter */}
              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <label htmlFor={searchInputId} className="sr-only">Search drives or companies</label>
                  <Input
                    id={searchInputId}
                    type="text"
                    placeholder="Search drive or company..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="pl-8 text-xs h-9 bg-[#0c1322]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredTableRows.length === 0 ? (
              <EmptyState
                title="No matching placement drives"
                description={
                  tableSearch
                    ? `No drives match "${tableSearch}". Try clearing your search or filter.`
                    : "No placement drive records found matching the active filters."
                }
                actionLabel="Clear Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="reports-key-metrics-table">
                  <thead>
                    <tr className="border-b border-[#1a2742] text-slate-400 font-semibold bg-[#0c1322]/80">
                      <th className="py-3 px-4">Placement Drive</th>
                      <th className="py-3 px-4">Corporate Partner</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Applicants</th>
                      <th className="py-3 px-4 text-center">Shortlisted</th>
                      <th className="py-3 px-4 text-center">Selected</th>
                      <th className="py-3 px-4 text-center">Offers</th>
                      <th className="py-3 px-4 text-center">Conversion</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2742]">
                    {filteredTableRows.map((drive) => (
                      <tr key={drive.id} className="hover:bg-[#162035]/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white max-w-[220px] truncate">
                          {drive.title}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">{drive.companyName}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              drive.status === "PUBLISHED"
                                ? "success"
                                : drive.status === "DRAFT"
                                ? "warning"
                                : "neutral"
                            }
                            className="text-[10px]"
                          >
                            {drive.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">
                          {drive.totalApplicants}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-purple-400">
                          {drive.shortlistedCount}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-blue-400">
                          {drive.selectedCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {drive.offersCount}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-300">
                          {drive.conversionRate}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={getExportUrl(drive.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30 transition-all"
                            title={`Export CSV for ${drive.title}`}
                          >
                            <Download className="h-3 w-3" />
                            <span>CSV</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
