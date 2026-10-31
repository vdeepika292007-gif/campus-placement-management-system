import React from "react";
import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-6 shadow-sm">
        <Compass className="h-8 w-8" />
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        404 — Page Not Found
      </h1>

      <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
        The placement drive, applicant record, or page you were looking for doesn't exist or has been relocated.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
