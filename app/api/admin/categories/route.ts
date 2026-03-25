import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categoriesTable, brokerCategoriesTable, propFirmCategoriesTable } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.name || !body.type) return NextResponse.json({ error: "Name and type are required" }, { status: 400 });

    // The slug is the flat SEO URL slug (e.g., "best-ecn-brokers")
    const slug = body.slug || slugify(body.name);

    const [existing] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, slug));
    if (existing) return NextResponse.json({ error: "Category with this slug already exists" }, { status: 409 });

    const [category] = await db.insert(categoriesTable).values({
      name: body.name,
      slug,
      type: body.type, // "broker" or "prop_firm"
      description: body.description || null,
      sortOrder: body.sortOrder || 0,
    }).returning();

    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, entityIds, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    // Update category fields
    if (Object.keys(data).length > 0) {
      await db.update(categoriesTable).set(data).where(eq(categoriesTable.id, id));
    }

    // Update entity assignments if provided
    if (entityIds && Array.isArray(entityIds)) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

      if (cat.type === "broker") {
        await db.delete(brokerCategoriesTable).where(eq(brokerCategoriesTable.categoryId, id));
        if (entityIds.length > 0) {
          await db.insert(brokerCategoriesTable).values(
            entityIds.map((brokerId: string) => ({ brokerId, categoryId: id }))
          );
        }
      } else if (cat.type === "prop_firm") {
        await db.delete(propFirmCategoriesTable).where(eq(propFirmCategoriesTable.categoryId, id));
        if (entityIds.length > 0) {
          await db.insert(propFirmCategoriesTable).values(
            entityIds.map((propFirmId: string) => ({ propFirmId, categoryId: id }))
          );
        }
      }
    }

    const [updated] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
