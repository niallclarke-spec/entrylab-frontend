import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageViewsTable } from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    const { slug, name, type } = await req.json();
    if (!slug || !name || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await db.insert(pageViewsTable).values({ slug, name, type });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Don't fail on view tracking errors
  }
}
