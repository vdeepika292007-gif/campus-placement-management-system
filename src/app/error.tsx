"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-6 shadow-sm">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Something went wrong
      </h1>

      <p className="mt-3 text-sm text-slate-600 max-w-md leading-relaxed">
        An unexpected error occurred while processing this request. Your data has not been lost.
      </p>

      <div className="mt-8">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
