import { db } from "@/lib/db";
import { gscIndexingLog } from "@/lib/schema";

const SCOPES = ["https://www.googleapis.com/auth/indexing"];
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";

let cachedServiceAccount: any = null;

function getServiceAccount() {
  if (cachedServiceAccount) return cachedServiceAccount;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT not configured");
  cachedServiceAccount = typeof raw === "string" ? JSON.parse(raw) : raw;
  return cachedServiceAccount;
}

// Simple JWT-based auth for Google APIs (no external lib needed)
async function getAccessToken(): Promise<string> {
  const sa = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);

  // Build JWT header and claim set
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: SCOPES.join(" "),
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  }));

  const signInput = `${header}.${claimSet}`;

  // Import private key and sign
  const pemKey = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signInput)
  );

  const jwt = `${signInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;

  // Exchange JWT for access token
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function submitUrlToGoogle(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(INDEXING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type }),
    });

    const status = res.status;
    const data = await res.json().catch(() => ({}));

    // Log to DB
    await db.insert(gscIndexingLog).values({
      url,
      status: status === 200 ? "submitted" : "error",
      submittedAt: new Date(),
      httpCode: status,
      errorMessage: status !== 200 ? JSON.stringify(data) : null,
    });

    if (status === 200) {
      console.log(`[Google Indexing] Submitted: ${url}`);
      return { success: true };
    } else {
      console.error(`[Google Indexing] Failed (${status}): ${url}`, data);
      return { success: false, error: JSON.stringify(data) };
    }
  } catch (err: any) {
    console.error(`[Google Indexing] Error submitting ${url}:`, err.message);

    await db.insert(gscIndexingLog).values({
      url,
      status: "error",
      errorMessage: err.message,
    }).catch(() => {});

    return { success: false, error: err.message };
  }
}
