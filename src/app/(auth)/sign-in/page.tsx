"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type RoleSelection = "STUDENT" | "ADMIN";

export default function SignInPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleSelection>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          intendedRole: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to sign in. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      // Route strictly based on verified user role
      if (data.user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/student/dashboard");
      }
      router.refresh();
    } catch {
      setErrorMessage("Network or server connection error. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = (role: RoleSelection) => {
    setSelectedRole(role);
    setErrorMessage("");
    // Optionally pre-populate or clear fields
    setEmail("");
    setPassword("");
  };

  const handleFillDemo = () => {
    if (selectedRole === "STUDENT") {
      setEmail("aarav.sharma@student.edu");
      setPassword("StudentDemo@123");
    } else {
      setEmail("admin@placement.edu");
      setPassword("AdminDemo@123");
    }
    setErrorMessage("");
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Campus Placement Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Secure sign-in for students and placement administration
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#1e2d4a] bg-[#0e1628]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Two Clear Choices: Role Selector */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Select Login Portal
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-[#080d1a] border border-[#1a253c]">
              <button
                type="button"
                onClick={() => handleRoleSwitch("STUDENT")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  selectedRole === "STUDENT"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121c32]"
                )}
                aria-pressed={selectedRole === "STUDENT"}
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Student Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch("ADMIN")}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                  selectedRole === "ADMIN"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#121c32]"
                )}
                aria-pressed={selectedRole === "ADMIN"}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Admin Login</span>
              </button>
            </div>
          </div>

          {/* Role Description Banner */}
          <div
            className={cn(
              "mb-6 rounded-xl p-3.5 border text-xs flex items-start gap-3 transition-colors",
              selectedRole === "STUDENT"
                ? "bg-blue-950/40 border-blue-800/50 text-blue-300"
                : "bg-indigo-950/40 border-indigo-800/50 text-indigo-300"
            )}
          >
            {selectedRole === "STUDENT" ? (
              <>
                <GraduationCap className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-slate-100">Student Placement Hub</strong>
                  Browse active drives, verify eligibility criteria, and track multi-round interview progress.
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-slate-100">Placement Cell Console</strong>
                  Restricted to placement officers to manage companies, drives, shortlists, and export reports.
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Input
                label="Email Address"
                type="email"
                placeholder={
                  selectedRole === "STUDENT"
                    ? "aarav.sharma@student.edu"
                    : "admin@placement.edu"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={cn(
                "w-full mt-2 font-bold shadow-lg transition-all",
                selectedRole === "STUDENT"
                  ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/25"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
              )}
              isLoading={isLoading}
            >
              <span>Sign In as {selectedRole === "STUDENT" ? "Student" : "Administrator"}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* 1-Click Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-[#1a253c]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Demo Credentials
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Pre-seeded & Active
              </span>
            </div>

            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full rounded-xl border border-[#223354] bg-[#080d1a] hover:bg-[#121c32] p-3 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                      selectedRole === "STUDENT"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Click to Autofill {selectedRole === "STUDENT" ? "Student" : "Admin"} Demo Account
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {selectedRole === "STUDENT"
                        ? "aarav.sharma@student.edu • StudentDemo@123"
                        : "admin@placement.edu • AdminDemo@123"}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  Fill →
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-xs text-slate-400">
          New student without an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            Register student profile
          </Link>
        </p>
      </div>
    </div>
  );
}
