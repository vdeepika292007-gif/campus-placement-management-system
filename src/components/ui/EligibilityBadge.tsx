import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, XCircle, HelpCircle } from "lucide-react";

export type EligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE" | "INCOMPLETE_PROFILE";

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  switch (status) {
    case "ELIGIBLE":
      return (
        <Badge variant="success" className="px-2.5 py-1">
          <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Eligible to Apply
        </Badge>
      );
    case "NOT_ELIGIBLE":
      return (
        <Badge variant="error" className="px-2.5 py-1">
          <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
          Criteria Not Met
        </Badge>
      );
    case "INCOMPLETE_PROFILE":
      return (
        <Badge variant="warning" className="px-2.5 py-1">
          <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
          Profile Incomplete
        </Badge>
      );
  }
}
