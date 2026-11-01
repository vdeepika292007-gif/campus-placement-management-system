"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileCheck2,
  User,
  Bell,
  Building2,
  Users,
  BarChart3,
  GraduationCap,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "STUDENT" | "ADMIN";
  unreadNotificationCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  role,
  unreadNotificationCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Placement Drives", href: "/student/drives", icon: Briefcase },
    { label: "My Applications", href: "/student/applications", icon: FileCheck2 },
    { label: "My Profile", href: "/student/profile", icon: User },
    {
      label: "Notifications",
      href: "/student/notifications",
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
    },
  ];

  const adminLinks = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Placement Drives", href: "/admin/drives", icon: Briefcase },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Analytics & Reports", href: "/admin/reports", icon: BarChart3 },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : null,
    },
  ];

  const links = role === "ADMIN" ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-[#0e1526] border-r border-[#1a253c] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[#1a253c]">
          <Link
            href={role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/30">
              {role === "ADMIN" ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">
                CPMS Portal
              </span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mt-0.5">
                {role === "ADMIN" ? "Placement Admin" : "Student Hub"}
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/student/dashboard" &&
                link.href !== "/admin/dashboard" &&
                pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-sm"
                    : "text-slate-400 hover:bg-[#162035] hover:text-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white shadow-sm">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Role Indicator */}
        <div className="p-4 border-t border-[#1a253c]">
          <div className="rounded-lg bg-[#121b2f] border border-[#1e2d4a] p-3 flex items-center gap-3">
            <div
              className={cn(
                "h-2 w-2 rounded-full ring-2 ring-offset-2 ring-offset-[#121b2f]",
                role === "ADMIN"
                  ? "bg-amber-400 ring-amber-400/30"
                  : "bg-emerald-400 ring-emerald-400/30"
              )}
            />
            <div className="text-xs">
              <p className="font-semibold text-slate-200">
                {role === "ADMIN" ? "Administrator Mode" : "Student Mode"}
              </p>
              <p className="text-[11px] text-slate-400">
                {role === "ADMIN" ? "Full Access Enforced" : "Verified Student"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
