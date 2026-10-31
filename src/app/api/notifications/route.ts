import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth(false);

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.id,
        readAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(false);
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      // Mark specific notification as read
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: session.id,
        },
        data: { readAt: new Date() },
      });
    } else {
      // Mark all notifications for this user as read
      await prisma.notification.updateMany({
        where: {
          userId: session.id,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, message: "Notifications updated." });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification read status." },
      { status: 500 }
    );
  }
}
