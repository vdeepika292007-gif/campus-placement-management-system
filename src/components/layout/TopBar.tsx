"use client";

import React from "react";
import Link from "next/link";
import { Menu, Bell, LogOut } from "lucide-react";

interface TopBarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "ADMIN";
  };
  onMenuClick?: () => void;
  unreadCount?: number;
}

export function TopBar({ user, onMenuClick, unreadCount = 0 }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#1a253c] bg-[#0e1526]/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-[#162035]"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Campus Placement Cell • AY 2025 - 2026
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Icon */}
        <Link
          href={user.role === "ADMIN" ? "/admin/notifications" : "/student/notifications"}
          className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#162035] transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#0e1526]" />
          )}
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-[#1a253c]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold text-xs uppercase shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-100 leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-slate-400">{user.email}</span>
          </div>

          {/* Sign Out Form */}
          <form action="/api/auth/sign-out" method="POST">
            <button
              type="submit"
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
