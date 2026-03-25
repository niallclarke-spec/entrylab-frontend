import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparisonsTable } from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (slug) {
      const [comp] = await db.select().from(comparisonsTable)
        .where(and(eq(comparisonsTable.slug, slug), inArray(comparisonsTable.status, ["published", "updated"])));
      if (!comp) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(comp);
    }
    const type = req.nextUrl.searchParams.get("type");
    const conditions = [inArray(comparisonsTable.status, ["published", "updated"])];
    if (type) conditions.push(eq(comparisonsTable.entityType, type));

    const comparisons = await db.select().from(comparisonsTable)
      .where(and(...conditions))
      .orderBy(desc(comparisonsTable.updatedAt))
      .limit(100);
    return NextResponse.json(comparisons);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
