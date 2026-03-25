"use client";

import { useState } from "react";
import { useAuth } from "@/components/AdminContext";
import { Send, RefreshCw, Loader2, Check, X } from "lucide-react";

export default function AdminSEOPage() {
  const { token } = useAuth();
  const [urls, setUrls] = useState("");
  const [revalidatePath, setRevalidatePath] = useState("");
  const [indexResults, setIndexResults] = useState<any>(null);
  const [revalResults, setRevalResults] = useState<any>(null);
  const [loading, setLoading] = useState<"index" | "reval" | null>(null);

  const handleIndex = async () => {
    setLoading("index");
    setIndexResults(null);
    try {
      const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
      const res = await fetch("/api/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls: urlList }),
      });
      setIndexResults(await res.json());
    } catch (err: any) {
      setIndexResults({ error: err.message });
    }
    setLoading(null);
  };

  const handleRevalidate = async (type?: string) => {
    setLoading("reval");
    setRevalResults(null);
    try {
      const body = type ? { type } : { path: revalidatePath };
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setRevalResults(await res.json());
    } catch (err: any) {
      setRevalResults({ error: err.message });
    }
    setLoading(null);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>SEO Tools</h1>

      {/* Google Indexing API */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
        <h2 className="font-semibold text-lg mb-2" style={{ color: "#111827" }}>Submit URLs to Google</h2>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Submit URLs to the Google Indexing API for immediate crawling. One URL per line.</p>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"/brokers/eightcap\n/compare/eightcap-vs-exness\n/news/my-article"}
          rows={6}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono border mb-4"
          style={{ borderColor: "#e8edea" }}
        />
        <button
          onClick={handleIndex}
          disabled={loading === "index" || !urls.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#2bb32a" }}
        >
          {loading === "index" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit to Google
        </button>
        {indexResults && (
          <div className="mt-4 p-4 rounded-lg text-sm" style={{ background: "#f8faf8" }}>
            {indexResults.error ? (
              <p className="text-red-500">{indexResults.error}</p>
            ) : (
              <>
                <p style={{ color: "#111827" }}>Submitted: {indexResults.submitted} | Failed: {indexResults.failed}</p>
                {indexResults.results?.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 mt-1">
                    {r.success ? <Check className="h-4 w-4" style={{ color: "#2bb32a" }} /> : <X className="h-4 w-4 text-red-500" />}
                    <span className="font-mono text-xs">{r.url}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ISR Revalidation */}
      <div className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid #e8edea" }}>
        <h2 className="font-semibold text-lg mb-2" style={{ color: "#111827" }}>Revalidate Pages (ISR)</h2>
        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>Force rebuild cached pages. Use after updating content in the admin panel.</p>

        <div className="flex gap-2 flex-wrap mb-4">
          {["all", "brokers", "prop-firms", "articles", "comparisons"].map((type) => (
            <button
              key={type}
              onClick={() => handleRevalidate(type)}
              disabled={loading === "reval"}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#e8edea", color: "#374151" }}
            >
              <RefreshCw className="h-3 w-3 inline mr-1" />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={revalidatePath}
            onChange={(e) => setRevalidatePath(e.target.value)}
            placeholder="/brokers/eightcap"
            className="flex-1 px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: "#e8edea" }}
          />
          <button
            onClick={() => handleRevalidate()}
            disabled={loading === "reval" || !revalidatePath.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#2bb32a" }}
          >
            Revalidate Path
          </button>
        </div>

        {revalResults && (
          <div className="mt-4 p-4 rounded-lg text-sm" style={{ background: "#f8faf8" }}>
            {revalResults.error ? (
              <p className="text-red-500">{revalResults.error}</p>
            ) : (
              <p style={{ color: "#2bb32a" }}>Revalidated: {JSON.stringify(revalResults.paths || revalResults.path)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
