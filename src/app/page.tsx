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
    <div className="flex min-h-screen flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
              CPMS Portal
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Campus Placement Management System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Student Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Next-Gen Placement Cell Automation</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-tight">
            Streamlining Campus Recruitment for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Students & Placement Cells
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A unified, transparent platform to browse visiting company drives, evaluate
            eligibility criteria with clear explanatory checklists, and track multi-stage interview progress.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
              <span>Get Started / Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all hover:-translate-y-0.5"
            >
              <span>Student Registration</span>
            </Link>
          </div>

          {/* Quick Demo Access Box */}
          <div className="mt-12 mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Demo Accounts (Fictional Records)
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ready for Testing
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-700">Placement Admin</span>
                  <span className="text-[10px] text-slate-400">Full Access</span>
                </div>
                <p className="text-xs text-slate-800 font-mono">admin@placement.edu</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Pass: AdminDemo@123</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-700">Eligible Student</span>
                  <span className="text-[10px] text-slate-400">CSE 2026 (8.75 CGPA)</span>
                </div>
                <p className="text-xs text-slate-800 font-mono">aarav.sharma@student.edu</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Pass: StudentDemo@123</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-white py-16 border-y border-slate-200/80 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Designed for Academic Rigor & Transparency
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Built in strict adherence to role boundaries, data protection, and configurable college criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200/80 p-6 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Explanatory Eligibility Check
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear evaluation across graduation year, CGPA, and branch. Students always know whether they qualify and why.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 p-6 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Strict Role-Based Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every action is authenticated on the server. Students only access their personal applications, and public registration cannot create admin accounts.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 p-6 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Live Persisted Metrics
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No fabricated dashboard statistics. Placement rates, application funnels, and recruitment schedules are calculated from PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-slate-500 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Campus Placement Management System (CPMS). Portfolio & Placement Cell Demo.</p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
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
