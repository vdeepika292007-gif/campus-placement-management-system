"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ALERT";
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : {}),
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Notifications & Announcements"
        description="Stay updated with new placement drive releases, shortlist calls, and recruitment schedule changes."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead()}
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white p-4 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When visiting companies publish placement drives or updates are posted to your applications, they will appear here."
          icon={<Bell className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = !notif.readAt;

            return (
              <Card
                key={notif.id}
                className={`p-4 transition-all ${
                  isUnread
                    ? "bg-blue-50/40 border-blue-200/90 shadow-2xs"
                    : "bg-white border-slate-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-700"
                          : notif.type === "WARNING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {notif.type === "SUCCESS" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : notif.type === "WARNING" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notif.linkUrl && (
                      <Link href={notif.linkUrl}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(notif.id);
                          }}
                        >
                          View
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 font-medium px-2 py-1"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
