import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brokersTable, comparisonsTable } from "@/lib/schema";
import { eq, asc, and, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

// GET /api/admin/brokers — list all (admin)
export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const brokers = await db.select().from(brokersTable).orderBy(asc(brokersTable.name));
  return NextResponse.json(brokers);
}

// POST /api/admin/brokers — create new broker
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = body.slug || slugify(body.name);

    // Check for duplicate slug
    const [existing] = await db.select({ id: brokersTable.id }).from(brokersTable).where(eq(brokersTable.slug, slug));
    if (existing) return NextResponse.json({ error: "A broker with this slug already exists" }, { status: 409 });

    // Auto-generate seoTitle if not provided
    if (!body.seoTitle) {
      body.seoTitle = `${body.name} Review ${new Date().getFullYear()} | EntryLab`.substring(0, 70);
    }

    const [broker] = await db.insert(brokersTable).values({ ...body, slug }).returning();

    // Auto-generate comparison drafts with all other brokers
    const otherBrokers = await db.select({ id: brokersTable.id, slug: brokersTable.slug, name: brokersTable.name })
      .from(brokersTable).where(ne(brokersTable.id, broker.id));

    if (otherBrokers.length > 0) {
      const comparisons = otherBrokers.map((other) => {
        const [a, b] = [broker, other].sort((x, y) => x.name.localeCompare(y.name));
        return {
          entityType: "broker" as const,
          comparisonType: "vs" as const,
          entityAId: a.id,
          entityBId: other.id === a.id ? broker.id : other.id,
          entityASlug: a.slug,
          entityBSlug: other.id === a.id ? broker.slug : other.slug,
          entityAName: a.name,
          entityBName: other.id === a.id ? broker.name : other.name,
          slug: `${a.slug}-vs-${other.id === a.id ? broker.slug : other.slug}`,
          status: "draft" as const,
        };
      });

      // Insert comparisons, skip duplicates
      for (const comp of comparisons) {
        try {
          await db.insert(comparisonsTable).values(comp);
        } catch {
          // Skip if slug already exists
        }
      }
    }

    return NextResponse.json(broker, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/brokers — update broker
export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { slug, ...data } = body;
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

    data.lastUpdated = new Date();
    const [updated] = await db.update(brokersTable).set(data).where(eq(brokersTable.slug, slug)).returning();
    if (!updated) return NextResponse.json({ error: "Broker not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/brokers?slug=xxx
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  const [deleted] = await db.delete(brokersTable).where(eq(brokersTable.slug, slug)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
