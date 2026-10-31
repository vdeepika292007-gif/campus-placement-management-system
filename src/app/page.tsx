import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Briefcase,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090d16] text-slate-100 selection:bg-blue-600/30 selection:text-blue-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1a253c] bg-[#0e1526]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight block leading-tight">
              CPMS Portal
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Campus Placement Management System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#162035] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500 transition-colors"
          >
            Student Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-indigo-600/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/15 px-3.5 py-1.5 text-xs font-semibold text-blue-400 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Next-Gen Placement Cell Automation</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight">
            Streamlining Campus Recruitment for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400">
              Students & Placement Cells
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A unified, transparent platform to browse visiting company drives, evaluate
            eligibility criteria with clear explanatory checklists, and track multi-stage interview progress.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all hover:-translate-y-0.5"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-[#27385c] bg-[#0e1628] px-6 py-3.5 text-sm font-bold text-slate-200 shadow-sm hover:bg-[#162035] transition-all hover:-translate-y-0.5"
            >
              <span>Student Registration</span>
            </Link>
          </div>

          {/* Quick Demo Access Box */}
          <div className="mt-14 mx-auto max-w-2xl rounded-2xl border border-[#1e2d4a] bg-[#0e1628]/95 p-6 shadow-xl text-left backdrop-blur-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1a253c]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Seeded Demo Accounts (Ready for Immediate Testing)
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                Active & Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2d4a]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Placement Admin
                  </span>
                  <span className="text-[10px] text-slate-500">Full Access</span>
                </div>
                <p className="text-xs text-slate-200 font-mono">admin@placement.edu</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Pass: AdminDemo@123</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2d4a]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Eligible Student
                  </span>
                  <span className="text-[10px] text-slate-500">CSE 2026 (8.75 CGPA)</span>
                </div>
                <p className="text-xs text-slate-200 font-mono">aarav.sharma@student.edu</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Pass: StudentDemo@123</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-[#0b101e] py-16 border-y border-[#1a253c] px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Designed for Academic Rigor & Transparency
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Built in strict adherence to role boundaries, data protection, and configurable college criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#1e2d4a] p-6 bg-[#0e1628] hover:bg-[#121c32] hover:border-blue-500/40 transition-all card-interactive">
              <div className="h-10 w-10 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Explanatory Eligibility Check
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear evaluation across graduation year, CGPA, and branch. Students always know whether they qualify and why.
              </p>
            </div>

            <div className="rounded-xl border border-[#1e2d4a] p-6 bg-[#0e1628] hover:bg-[#121c32] hover:border-indigo-500/40 transition-all card-interactive">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Strict Role-Based Security
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every action is authenticated on the server. Students only access their personal applications, and public registration cannot create admin accounts.
              </p>
            </div>

            <div className="rounded-xl border border-[#1e2d4a] p-6 bg-[#0e1628] hover:bg-[#121c32] hover:border-emerald-500/40 transition-all card-interactive">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Live Persisted Metrics
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No fabricated dashboard statistics. Placement rates, application funnels, and recruitment schedules are calculated from PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-slate-500 border-t border-[#1a253c]">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Campus Placement Management System (CPMS). Portfolio & Placement Cell Demo.</p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
            <span>Next.js 16 (App Router)</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Prisma ORM</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
