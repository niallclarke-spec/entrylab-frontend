import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailCaptures } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    await db.insert(emailCaptures).values({
      email: body.email,
      source: body.source || "newsletter",
      utmCampaign: body.utmCampaign || null,
      utmSource: body.utmSource || null,
      utmMedium: body.utmMedium || null,
      utmContent: body.utmContent || null,
      utmTerm: body.utmTerm || null,
      gclid: body.gclid || null,
      fbclid: body.fbclid || null,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // If duplicate email, still return success (don't reveal it exists)
    if (err.message?.includes("unique") || err.message?.includes("duplicate")) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
