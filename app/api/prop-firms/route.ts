import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { propFirmsTable } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (slug) {
      const [firm] = await db.select().from(propFirmsTable).where(eq(propFirmsTable.slug, slug));
      if (!firm) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(firm);
    }
    const firms = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));
    return NextResponse.json(firms);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
