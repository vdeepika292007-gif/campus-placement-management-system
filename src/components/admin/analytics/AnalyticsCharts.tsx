"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Users,
  Briefcase,
  Building2,
  Award,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Info,
} from "lucide-react";

// ============================================================================
// 1. Department Distribution Bar Chart
// ============================================================================
interface DepartmentData {
  department: string;
  count: number;
  percentage: number;
}

export function DepartmentChart({ data }: { data: DepartmentData[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">No department records available.</div>;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3.5" id="chart-department-distribution">
      {data.map((item, idx) => {
        const barWidth = Math.max((item.count / maxCount) * 100, 3);
        const palette = [
          "from-blue-600 to-indigo-500",
          "from-indigo-500 to-purple-500",
          "from-purple-500 to-pink-500",
          "from-cyan-500 to-blue-500",
          "from-emerald-500 to-teal-500",
          "from-amber-500 to-orange-500",
        ];
        const gradient = palette[idx % palette.length];

        return (
          <div key={item.department} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200 group-hover:text-white transition-colors truncate max-w-[240px]">
                {item.department}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-white text-xs">{item.count}</span>
                <span className="text-[11px] text-slate-400">({item.percentage}%)</span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-[#162035] rounded-full overflow-hidden border border-[#223354]/60">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all duration-500 group-hover:brightness-110 shadow-sm",
                  gradient
                )}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 2. Application Status Funnel / Donut Chart
// ============================================================================
interface StatusData {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export function StatusBreakdownChart({ data }: { data: StatusData[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">No application status data found.</div>;
  }

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6" id="chart-application-status">
      {/* Visual SVG Donut */}
      <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="#162035"
            strokeWidth="18"
          />
          {total > 0 &&
            data.map((item) => {
              if (item.count === 0) return null;
              const strokeDasharray = `${(item.count / total) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += (item.count / total) * circumference;

              return (
                <circle
                  key={item.status}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="18"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-85"
                />
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold text-white">{total}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Submissions</span>
        </div>
      </div>

      {/* Legend & Breakdown Badges */}
      <div className="flex-1 w-full grid grid-cols-2 gap-2 text-xs">
        {data.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between p-2 rounded-lg bg-[#0c1322]/70 border border-[#1a2742] hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300 truncate text-[11px]">{item.label}</span>
            </div>
            <span className="font-bold text-white text-[11px] shrink-0 ml-1">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Applications and Offers by Top Companies Chart
// ============================================================================
interface CompanyPerformanceData {
  companyId: string;
  name: string;
  applications: number;
  offers: number;
  conversionRate: number;
}

export function CompanyPerformanceChart({ data }: { data: CompanyPerformanceData[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">No corporate application data available.</div>;
  }

  const maxApps = Math.max(...data.map((d) => d.applications), 1);

  return (
    <div className="space-y-3.5" id="chart-company-performance">
      {data.map((company) => {
        const appWidth = Math.max((company.applications / maxApps) * 100, 4);
        const offerWidth = Math.max((company.offers / maxApps) * 100, company.offers > 0 ? 2 : 0);

        return (
          <div
            key={company.companyId}
            className="p-3 rounded-lg bg-[#0c1322]/50 border border-[#1a2742] hover:border-[#223354] transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                {company.name}
              </span>
              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                <span className="text-blue-400 font-medium">
                  {company.applications} Apps
                </span>
                <span className="text-emerald-400 font-bold">
                  {company.offers} Offers
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-[#162035] px-1.5 py-0.5 rounded border border-[#223354]">
                  {company.conversionRate}% Conv.
                </span>
              </div>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-1">
              {/* Applications Bar */}
              <div className="h-2 w-full bg-[#162035] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${appWidth}%` }}
                />
              </div>
              {/* Offers Bar */}
              <div className="h-1.5 w-full bg-[#162035] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${offerWidth}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 4. Placement Drives by Status
// ============================================================================
interface DriveStatusData {
  status: string;
  label: string;
  count: number;
  color: string;
}

export function DriveStatusChart({ data }: { data: DriveStatusData[] }) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-4" id="chart-drives-by-status">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.map((item) => (
          <div
            key={item.status}
            className="p-3.5 rounded-xl bg-[#0c1322] border border-[#1a2742] space-y-1 text-center"
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-white">{item.count}</div>
            <span className="text-[10px] text-slate-500">
              {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}% of drives
            </span>
          </div>
        ))}
      </div>

      {/* Segmented Progress Strip */}
      <div className="h-2.5 w-full bg-[#162035] rounded-full overflow-hidden flex border border-[#223354]">
        {total > 0 &&
          data.map((item) => {
            if (item.count === 0) return null;
            const widthPct = (item.count / total) * 100;
            return (
              <div
                key={item.status}
                className="h-full transition-all duration-300"
                style={{ width: `${widthPct}%`, backgroundColor: item.color }}
                title={`${item.label}: ${item.count}`}
              />
            );
          })}
      </div>
    </div>
  );
}

// ============================================================================
// 5. Placement Outcomes Timeline (Interactive SVG Line / Bar Chart)
// ============================================================================
interface TimelinePoint {
  date: string;
  displayDate: string;
  applications: number;
  offers: number;
}

export function PlacementTimelineChart({ data }: { data: TimelinePoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-xs text-slate-400">No chronological timeline entries recorded yet.</div>;
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.applications, d.offers)),
    10
  );

  const chartHeight = 160;
  const paddingX = 25;
  const paddingY = 20;
  const innerHeight = chartHeight - paddingY * 2;
  const totalPoints = data.length;

  return (
    <div className="space-y-4" id="chart-placement-timeline">
      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-blue-500" />
            <span className="text-slate-300">Daily Applications</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-400" />
            <span className="text-slate-300">Offers / Selections</span>
          </div>
        </div>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#162035] border border-[#223354] text-white flex items-center gap-2">
            <span className="text-slate-400">{data[hoveredIdx].date}:</span>
            <span className="text-blue-400">{data[hoveredIdx].applications} apps</span>
            <span className="text-emerald-400">{data[hoveredIdx].offers} offers</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-[480px]">
          <svg className="w-full h-44" viewBox={`0 0 600 ${chartHeight}`} preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = paddingY + innerHeight * (1 - pct);
              return (
                <line
                  key={pct}
                  x1={paddingX}
                  y1={y}
                  x2={600 - paddingX}
                  y2={y}
                  stroke="#1c2842"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              );
            })}

            {/* Bars for each point */}
            {data.map((point, i) => {
              const step = (600 - paddingX * 2) / Math.max(totalPoints, 1);
              const x = paddingX + i * step + step / 2;
              const appHeight = (point.applications / maxVal) * innerHeight;
              const offerHeight = (point.offers / maxVal) * innerHeight;
              const appY = chartHeight - paddingY - appHeight;
              const offerY = chartHeight - paddingY - offerHeight;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={point.date}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible touch/hover target */}
                  <rect
                    x={x - step / 2}
                    y={paddingY}
                    width={step}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {/* Highlight bar background */}
                  {isHovered && (
                    <rect
                      x={x - step / 2 + 2}
                      y={paddingY}
                      width={step - 4}
                      height={innerHeight}
                      fill="#1e2d4a"
                      opacity="0.4"
                      rx="4"
                    />
                  )}

                  {/* Applications Bar */}
                  <rect
                    x={x - 8}
                    y={appY}
                    width={7}
                    height={Math.max(appHeight, 2)}
                    fill={isHovered ? "#60a5fa" : "#3b82f6"}
                    rx="2"
                    className="transition-colors"
                  />

                  {/* Offers Bar */}
                  <rect
                    x={x + 1}
                    y={offerY}
                    width={7}
                    height={Math.max(offerHeight, point.offers > 0 ? 2 : 0)}
                    fill={isHovered ? "#34d399" : "#10b981"}
                    rx="2"
                    className="transition-colors"
                  />

                  {/* Date label */}
                  <text
                    x={x}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    fill={isHovered ? "#ffffff" : "#64748b"}
                    fontSize="9"
                    fontWeight={isHovered ? "700" : "500"}
                  >
                    {point.displayDate}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
