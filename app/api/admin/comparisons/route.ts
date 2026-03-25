import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparisonsTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const comparisons = await db.select().from(comparisonsTable).orderBy(desc(comparisonsTable.updatedAt));
  return NextResponse.json(comparisons);
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { slug, ...data } = body;
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    data.updatedAt = new Date();
    if (data.status === "published" && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    const [updated] = await db.update(comparisonsTable).set(data).where(eq(comparisonsTable.slug, slug)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
  const [deleted] = await db.delete(comparisonsTable).where(eq(comparisonsTable.slug, slug)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
