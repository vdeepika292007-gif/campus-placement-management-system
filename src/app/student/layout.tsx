import React from "react";
import { requireStudent } from "@/lib/auth/permissions";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent(true);

  let unreadCount = 0;
  try {
    unreadCount = await prisma.notification.count({
      where: {
        userId: session.id,
        readAt: null,
      },
    });
  } catch {
    unreadCount = 0;
  }

  return (
    <AppShell user={session} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
