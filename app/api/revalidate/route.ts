import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

// POST /api/revalidate — trigger ISR rebuild for a specific path
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { path, type } = await req.json();

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    // Revalidate by type
    if (type === "brokers") {
      revalidatePath("/brokers");
      revalidatePath("/");
      return NextResponse.json({ revalidated: true, paths: ["/brokers", "/"] });
    }

    if (type === "prop-firms") {
      revalidatePath("/prop-firms");
      revalidatePath("/");
      return NextResponse.json({ revalidated: true, paths: ["/prop-firms", "/"] });
    }

    if (type === "articles") {
      revalidatePath("/news");
      revalidatePath("/learn");
      revalidatePath("/blog");
      revalidatePath("/");
      return NextResponse.json({ revalidated: true, paths: ["/news", "/learn", "/blog", "/"] });
    }

    if (type === "comparisons") {
      revalidatePath("/compare");
      return NextResponse.json({ revalidated: true, paths: ["/compare"] });
    }

    if (type === "all") {
      revalidatePath("/", "layout");
      return NextResponse.json({ revalidated: true, paths: ["all"] });
    }

    return NextResponse.json({ error: "Provide path or type" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
