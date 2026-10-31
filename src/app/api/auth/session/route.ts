import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await clearSessionCookie();

  const referer = req.headers.get("referer");
  if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.json({ success: true, message: "Signed out successfully" });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}
