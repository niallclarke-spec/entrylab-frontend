import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewsTable } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/reviews?firmSlug=eightcap&firmType=broker
export async function GET(req: NextRequest) {
  const firmSlug = req.nextUrl.searchParams.get("firmSlug");
  const firmType = req.nextUrl.searchParams.get("firmType") || "broker";

  if (!firmSlug) return NextResponse.json([]);

  const reviews = await db.select().from(reviewsTable)
    .where(and(
      eq(reviewsTable.firmSlug, firmSlug),
      eq(reviewsTable.firmType, firmType),
      eq(reviewsTable.status, "approved")
    ))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(20);

  return NextResponse.json(reviews);
}

// POST /api/reviews — submit a review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.firmSlug || !body.reviewerName || !body.rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [review] = await db.insert(reviewsTable).values({
      firmType: body.firmType || "broker",
      firmSlug: body.firmSlug,
      firmName: body.firmName || body.firmSlug,
      reviewerName: body.reviewerName,
      reviewerEmail: body.reviewerEmail || null,
      rating: body.rating,
      title: body.title || null,
      reviewText: body.reviewText || null,
      newsletterOptin: body.newsletterOptin || false,
      status: "pending",
    }).returning();

    // TODO: Send Telegram notification for new review

    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
