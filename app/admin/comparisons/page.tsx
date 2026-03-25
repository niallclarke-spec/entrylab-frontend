"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../layout";
import { Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminComparisonsPage() {
  const { token } = useAuth();
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const fetchComparisons = async () => {
    const res = await fetch("/api/admin/comparisons", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setComparisons(data);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchComparisons(); }, [token]);

  const handleSave = async (formData: any) => {
    const res = await fetch("/api/admin/comparisons", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setEditing(null); fetchComparisons(); }
    else { const err = await res.json(); alert(err.error || "Save failed"); }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this comparison?")) return;
    await fetch(`/api/admin/comparisons?slug=${slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchComparisons();
  };

  if (loading) return <div className="flex items-center gap-2" style={{ color: "#6b7280" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  const filtered = filter === "all" ? comparisons : comparisons.filter(c => c.status === filter);
  const draftCount = comparisons.filter(c => c.status === "draft").length;
  const publishedCount = comparisons.filter(c => c.status === "published" || c.status === "updated").length;

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Edit: {editing.entityAName} vs {editing.entityBName}</h1>
          <button onClick={() => setEditing(null)} className="text-sm" style={{ color: "#6b7280" }}>Cancel</button>
        </div>
        <ComparisonForm initial={editing} onSave={handleSave} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Comparisons ({comparisons.length})</h1>
        <div className="flex gap-2">
          {(["all", "draft", "published"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "text-white" : ""}`}
              style={{ background: filter === f ? "#2bb32a" : "rgba(0,0,0,0.05)", color: filter === f ? "#fff" : "#6b7280" }}>
              {f === "all" ? `All (${comparisons.length})` : f === "draft" ? `Drafts (${draftCount})` : `Published (${publishedCount})`}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((comp) => (
          <div key={comp.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{comp.entityAName} vs {comp.entityBName}</h3>
                {comp.status === "published" || comp.status === "updated" ? <Eye className="h-3.5 w-3.5" style={{ color: "#2bb32a" }} /> : <EyeOff className="h-3.5 w-3.5" style={{ color: "#9ca3af" }} />}
              </div>
              <p className="text-xs" style={{ color: "#6b7280" }}>{comp.entityType} · /compare/{comp.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(comp)} className="p-2 rounded-lg hover:bg-gray-100"><Pencil className="h-4 w-4" style={{ color: "#6b7280" }} /></button>
              <button onClick={() => handleDelete(comp.slug)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonForm({ initial, onSave }: { initial: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState<any>({ ...initial });
  const [faqText, setFaqText] = useState(JSON.stringify(initial.faqData || [], null, 2));
  const [winnersText, setWinnersText] = useState(JSON.stringify(initial.categoryWinners || [], null, 2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSave({
        slug: form.slug,
        status: form.status,
        overallWinnerId: form.overallWinnerId,
        overallScore: form.overallScore,
        faqData: JSON.parse(faqText),
        categoryWinners: JSON.parse(winnersText),
      });
    } catch { alert("Invalid JSON in FAQ or Category Winners"); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="updated">Updated</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Overall Score</label>
            <input value={form.overallScore || ""} onChange={(e) => setForm({ ...form, overallScore: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Overall Winner ID</label>
          <select value={form.overallWinnerId || ""} onChange={(e) => setForm({ ...form, overallWinnerId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }}>
            <option value="">No winner</option>
            <option value={form.entityAId}>{form.entityAName}</option>
            <option value={form.entityBId}>{form.entityBName}</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
        <h2 className="font-semibold" style={{ color: "#111827" }}>Category Winners (JSON)</h2>
        <textarea value={winnersText} onChange={(e) => setWinnersText(e.target.value)} rows={10}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono border" style={{ borderColor: "#e8edea" }} />
        <p className="text-xs" style={{ color: "#9ca3af" }}>Format: [{"{"}"label": "Spreads", "winnerName": "Eightcap", "scoreA": 8, "scoreB": 7{"}"}]</p>
      </div>
      <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
        <h2 className="font-semibold" style={{ color: "#111827" }}>FAQ Data (JSON)</h2>
        <textarea value={faqText} onChange={(e) => setFaqText(e.target.value)} rows={10}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono border" style={{ borderColor: "#e8edea" }} />
        <p className="text-xs" style={{ color: "#9ca3af" }}>Format: [{"{"}"q": "Question?", "a": "Answer."{"}"}]</p>
      </div>
      <button type="submit" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>Save Changes</button>
    </form>
  );
}
