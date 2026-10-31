import React from "react";
import { Badge } from "@/lib/../components/ui/Badge";
import { CheckCircle2, Clock, AlertCircle, XCircle, Award, UserCheck, Calendar } from "lucide-react";

export type ApplicationStatusType =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "ASSESSMENT_SCHEDULED"
  | "INTERVIEW_SCHEDULED"
  | "SELECTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "OFFER_RECORDED";

export type DriveStatusType = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export function ApplicationStatusBadge({ status }: { status: ApplicationStatusType | string }) {
  switch (status) {
    case "APPLIED":
      return (
        <Badge variant="info">
          <Clock className="w-3 h-3 mr-1" />
          Applied
        </Badge>
      );
    case "UNDER_REVIEW":
      return (
        <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      );
    case "SHORTLISTED":
      return (
        <Badge variant="purple">
          <UserCheck className="w-3 h-3 mr-1" />
          Shortlisted
        </Badge>
      );
    case "ASSESSMENT_SCHEDULED":
      return (
        <Badge variant="default">
          <Calendar className="w-3 h-3 mr-1" />
          Assessment Scheduled
        </Badge>
      );
    case "INTERVIEW_SCHEDULED":
      return (
        <Badge variant="default">
          <Calendar className="w-3 h-3 mr-1" />
          Interview Scheduled
        </Badge>
      );
    case "SELECTED":
      return (
        <Badge variant="success">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Selected
        </Badge>
      );
    case "OFFER_RECORDED":
      return (
        <Badge variant="success" className="font-semibold shadow-xs">
          <Award className="w-3 h-3 mr-1" />
          Offer Recorded
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="error">
          <XCircle className="w-3 h-3 mr-1" />
          Not Selected
        </Badge>
      );
    case "WITHDRAWN":
      return (
        <Badge variant="neutral">
          <AlertCircle className="w-3 h-3 mr-1" />
          Withdrawn
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function DriveStatusBadge({ status }: { status: DriveStatusType | string }) {
  switch (status) {
    case "PUBLISHED":
      return (
        <Badge variant="success">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Open
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge variant="warning">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Draft
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Closed
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge variant="neutral">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Archived
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
