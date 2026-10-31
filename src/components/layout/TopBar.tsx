"use client";

import React from "react";
import Link from "next/link";
import { Menu, Bell, LogOut, User as UserIcon } from "lucide-react";

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 text-slate-500 hover:text-slate-800 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Academic Year 2025 - 2026
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications Icon */}
        <Link
          href={user.role === "ADMIN" ? "/admin/notifications" : "/student/notifications"}
          className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
          )}
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {user.name}
            </span>
            <span className="text-[11px] text-slate-500">{user.email}</span>
          </div>

          {/* Sign Out Form */}
          <form action="/api/auth/sign-out" method="POST">
            <button
              type="submit"
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
