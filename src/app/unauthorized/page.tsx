import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#090d16] p-6 text-center text-slate-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-6 shadow-lg shadow-amber-500/10">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Access Denied
      </h1>

      <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
        You do not have the required role permissions to access this area. This section is restricted to authorized Placement Administrators.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 z-10">
        <Link href="/sign-in">
          <Button variant="outline" size="md">
            <LogIn className="h-4 w-4 mr-2" />
            Sign in with Another Account
          </Button>
        </Link>

        <Link href="/">
          <Button variant="primary" size="md">
            <Home className="h-4 w-4 mr-2" />
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
