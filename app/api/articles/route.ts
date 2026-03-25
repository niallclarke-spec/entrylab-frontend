import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articlesTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (slug) {
      const [article] = await db.select().from(articlesTable)
        .where(and(eq(articlesTable.slug, slug), eq(articlesTable.status, "published")));
      if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(article);
    }
    const articles = await db.select().from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedAt))
      .limit(100);
    return NextResponse.json(articles);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
