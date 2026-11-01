import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AnalyticsView } from "@/components/admin/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  // Enforce server-side administrator authorization
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Comprehensive placement statistics, department rosters, corporate conversion funnels, and data audit exports."
        badge={
          <Badge variant="default" className="font-semibold">
            Admin Console
          </Badge>
        }
      />

      {/* Interactive Analytics & Reports Dashboard with Live Database Sync */}
      <AnalyticsView />
    </div>
  );
}
