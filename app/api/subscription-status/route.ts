import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signalUsers, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  try {
    const [user] = await db.select().from(signalUsers).where(eq(signalUsers.email, email));
    if (!user) return NextResponse.json({ error: "No subscription found for this email" }, { status: 404 });

    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));

    return NextResponse.json({
      email: user.email,
      status: sub?.status || "inactive",
      planType: sub?.planType || null,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
      telegramInviteLink: user.telegramInviteLink || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
