import { google } from "googleapis";
import { db } from "./db";
import { gscIndexingLog, gscPerformance, gscQueries } from "../shared/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "https://entrylab.io";
const GSC_PROPERTY = process.env.GSC_PROPERTY || "sc-domain:entrylab.io";

export function gscEnabled(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

function getAuth(): any | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: [
        "https://www.googleapis.com/auth/indexing",
        "https://www.googleapis.com/auth/webmasters.readonly",
      ],
    });
  } catch {
    return null;
  }
}

// ─── Fire-and-forget batch URL submission ────────────────────────────────────

export function scheduleIndexingSubmission(paths: string[]): void {
  if (!gscEnabled()) return;
  const urls = paths.map((p) => (p.startsWith("http") ? p : `${BASE_URL}${p}`));
  submitUrlBatch(urls).catch(() => {});
}

async function submitUrlBatch(urls: string[]): Promise<void> {
  const auth = getAuth();
  if (!auth) return;

  for (const url of urls) {
    await db
      .insert(gscIndexingLog)
      .values({ url, status: "queued" })
      .catch(() => {});
  }

  const authClient = await auth.getClient();
  const indexing = google.indexing({ version: "v3", auth: authClient });

  for (const url of urls) {
    try {
      const res = await indexing.urlNotifications.publish({
        requestBody: { url, type: "URL_UPDATED" },
      });
      await db
        .update(gscIndexingLog)
        .set({ status: "submitted", submittedAt: new Date(), httpCode: res.status })
        .where(eq(gscIndexingLog.url, url))
        .catch(() => {});
    } catch (err: any) {
      await db
        .update(gscIndexingLog)
        .set({ status: "error", errorMessage: (err.message || "Unknown").slice(0, 500) })
        .where(eq(gscIndexingLog.url, url))
        .catch(() => {});
    }
  }
}

// ─── Awaitable single URL submit (for admin manual submit) ───────────────────

export async function submitSingleUrl(
  path: string
): Promise<{ ok: boolean; url: string; error?: string }> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const auth = getAuth();
  if (!auth) return { ok: false, url, error: "GSC not configured — check GOOGLE_SERVICE_ACCOUNT_JSON secret" };

  await db.insert(gscIndexingLog).values({ url, status: "queued" }).catch(() => {});

  try {
    const authClient = await auth.getClient();
    const indexing = google.indexing({ version: "v3", auth: authClient });
    const res = await indexing.urlNotifications.publish({
      requestBody: { url, type: "URL_UPDATED" },
    });
    await db
      .update(gscIndexingLog)
      .set({ status: "submitted", submittedAt: new Date(), httpCode: res.status })
      .where(eq(gscIndexingLog.url, url))
      .catch(() => {});
    return { ok: true, url };
  } catch (err: any) {
    const errorMessage = (err.message || "Unknown error").slice(0, 500);
    await db
      .update(gscIndexingLog)
      .set({ status: "error", errorMessage })
      .where(eq(gscIndexingLog.url, url))
      .catch(() => {});
    return { ok: false, url, error: errorMessage };
  }
}

// ─── GSC Search Analytics sync ───────────────────────────────────────────────

export async function syncGscData(
  days: number = 28
): Promise<{ pages: number; queries: number; error?: string }> {
  const auth = getAuth();
  if (!auth) return { pages: 0, queries: 0, error: "GSC not configured" };

  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); // 2-3 day GSC data delay
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);

    const toStr = (d: Date) => d.toISOString().split("T")[0];
    const authClient = await auth.getClient();
    const webmasters = google.webmasters({ version: "v3", auth: authClient });

    // ── Page-level data ──────────────────────────────────────────────────────
    const pageRes = await webmasters.searchanalytics.query({
      siteUrl: GSC_PROPERTY,
      requestBody: {
        startDate: toStr(startDate),
        endDate: toStr(endDate),
        dimensions: ["page", "date"],
        rowLimit: 5000,
      },
    });

    let pages = 0;
    for (const row of pageRes.data.rows || []) {
      const [url, date] = row.keys || [];
      if (!url || !date) continue;
      await db
        .insert(gscPerformance)
        .values({
          url,
          date,
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: String(row.ctr ?? 0),
          position: String(row.position ?? 0),
        })
        .onConflictDoUpdate({
          target: [gscPerformance.url, gscPerformance.date],
          set: {
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: String(row.ctr ?? 0),
            position: String(row.position ?? 0),
            syncedAt: new Date(),
          },
        })
        .catch(() => {});
      pages++;
    }

    // ── Query-level data ─────────────────────────────────────────────────────
    const queryRes = await webmasters.searchanalytics.query({
      siteUrl: GSC_PROPERTY,
      requestBody: {
        startDate: toStr(startDate),
        endDate: toStr(endDate),
        dimensions: ["query", "page", "date"],
        rowLimit: 5000,
      },
    });

    let queries = 0;
    for (const row of queryRes.data.rows || []) {
      const [query, url, date] = row.keys || [];
      if (!query || !url || !date) continue;
      await db
        .insert(gscQueries)
        .values({
          query,
          url,
          date,
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: String(row.ctr ?? 0),
          position: String(row.position ?? 0),
        })
        .onConflictDoUpdate({
          target: [gscQueries.query, gscQueries.url, gscQueries.date],
          set: {
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: String(row.ctr ?? 0),
            position: String(row.position ?? 0),
          },
        })
        .catch(() => {});
      queries++;
    }

    return { pages, queries };
  } catch (err: any) {
    console.error("[GSC] Sync error:", err.message);
    return { pages: 0, queries: 0, error: err.message || "Sync failed" };
  }
}

// ─── Daily sync scheduler ────────────────────────────────────────────────────

export function startDailyGscSync(): void {
  if (!gscEnabled()) {
    console.log("[GSC] Skipping daily sync — GOOGLE_SERVICE_ACCOUNT_JSON not set");
    return;
  }
  // Run once 30 seconds after startup, then every 24 hours
  setTimeout(() => {
    console.log("[GSC] Running initial data sync...");
    syncGscData(28).then(({ pages, queries, error }) => {
      if (error) console.error("[GSC] Initial sync error:", error);
      else console.log(`[GSC] Initial sync complete — ${pages} page rows, ${queries} query rows`);
    });
  }, 30_000);

  setInterval(() => {
    console.log("[GSC] Running daily data sync...");
    syncGscData(28).then(({ pages, queries, error }) => {
      if (error) console.error("[GSC] Daily sync error:", error);
      else console.log(`[GSC] Daily sync complete — ${pages} page rows, ${queries} query rows`);
    });
  }, 24 * 60 * 60 * 1000);
}
