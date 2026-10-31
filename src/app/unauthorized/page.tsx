import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-6 shadow-sm">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Access Denied
      </h1>

      <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
        You do not have the required permissions to access this area. This page is restricted to authorized roles (Placement Administrators or verified candidates).
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/sign-in">
          <Button variant="outline" size="md">
            <ArrowLeft className="h-4 w-4 mr-2" />
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
