import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { submitUrlToGoogle } from "@/lib/google-indexing";

// POST /api/indexing — submit URL(s) to Google Indexing API
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { urls, url } = await req.json();
    const urlList: string[] = urls || (url ? [url] : []);

    if (urlList.length === 0) {
      return NextResponse.json({ error: "Provide url or urls array" }, { status: 400 });
    }

    const results = await Promise.all(
      urlList.map(async (u: string) => {
        const fullUrl = u.startsWith("http") ? u : `https://entrylab.io${u}`;
        const result = await submitUrlToGoogle(fullUrl);
        return { url: fullUrl, ...result };
      })
    );

    const submitted = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ submitted, failed, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
