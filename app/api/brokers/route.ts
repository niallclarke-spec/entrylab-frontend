import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { brokersTable } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/brokers — list all brokers
// GET /api/brokers?slug=eightcap — get single broker
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");

    if (slug) {
      const [broker] = await db.select().from(brokersTable).where(eq(brokersTable.slug, slug));
      if (!broker) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(broker);
    }

    const brokers = await db.select().from(brokersTable).orderBy(asc(brokersTable.name));
    return NextResponse.json(brokers);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
