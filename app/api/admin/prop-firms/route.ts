import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propFirmsTable, comparisonsTable } from "@/lib/schema";
import { eq, asc, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const firms = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));
  return NextResponse.json(firms);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = body.slug || slugify(body.name);
    const [existing] = await db.select({ id: propFirmsTable.id }).from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
    if (existing) return NextResponse.json({ error: "A prop firm with this slug already exists" }, { status: 409 });

    if (!body.seoTitle) {
      body.seoTitle = `${body.name} Review ${new Date().getFullYear()} | EntryLab`.substring(0, 70);
    }

    const [firm] = await db.insert(propFirmsTable).values({ ...body, slug }).returning();

    // Auto-generate comparison drafts
    const otherFirms = await db.select({ id: propFirmsTable.id, slug: propFirmsTable.slug, name: propFirmsTable.name })
      .from(propFirmsTable).where(ne(propFirmsTable.id, firm.id));

    for (const other of otherFirms) {
      const [a, b] = [firm, other].sort((x, y) => x.name.localeCompare(y.name));
      try {
        await db.insert(comparisonsTable).values({
          entityType: "prop_firm",
          comparisonType: "vs",
          entityAId: a.id, entityBId: b.id,
          entityASlug: a.slug, entityBSlug: b.slug,
          entityAName: a.name, entityBName: b.name,
          slug: `${a.slug}-vs-${b.slug}`,
          status: "draft",
        });
      } catch {}
    }

    return NextResponse.json(firm, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { slug, ...data } = body;
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    data.lastUpdated = new Date();
    const [updated] = await db.update(propFirmsTable).set(data).where(eq(propFirmsTable.slug, slug)).returning();
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
  const [deleted] = await db.delete(propFirmsTable).where(eq(propFirmsTable.slug, slug)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
