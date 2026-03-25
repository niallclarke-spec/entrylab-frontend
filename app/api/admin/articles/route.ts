import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articlesTable } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const articles = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const slug = body.slug || slugify(body.title);
    const [existing] = await db.select({ id: articlesTable.id }).from(articlesTable).where(eq(articlesTable.slug, slug));
    if (existing) return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });

    if (body.status === "published" && !body.publishedAt) {
      body.publishedAt = new Date();
    }

    const [article] = await db.insert(articlesTable).values({ ...body, slug }).returning();
    return NextResponse.json(article, { status: 201 });
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

    data.updatedAt = new Date();
    if (data.status === "published") {
      const [existing] = await db.select({ publishedAt: articlesTable.publishedAt })
        .from(articlesTable).where(eq(articlesTable.slug, slug));
      if (existing && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const [updated] = await db.update(articlesTable).set(data).where(eq(articlesTable.slug, slug)).returning();
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
  const [deleted] = await db.delete(articlesTable).where(eq(articlesTable.slug, slug)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
