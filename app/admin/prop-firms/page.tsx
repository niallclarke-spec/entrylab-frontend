"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../layout";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";

export default function AdminPropFirmsPage() {
  const { token } = useAuth();
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchFirms = async () => {
    const res = await fetch("/api/admin/prop-firms", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setFirms(data);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchFirms(); }, [token]);

  const handleSave = async (formData: any) => {
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/admin/prop-firms", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setShowForm(false); setEditing(null); fetchFirms(); }
    else { const err = await res.json(); alert(err.error || "Save failed"); }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this prop firm?")) return;
    await fetch(`/api/admin/prop-firms?slug=${slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchFirms();
  };

  if (loading) return <div className="flex items-center gap-2" style={{ color: "#6b7280" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  if (showForm || editing) {
    return <PropFirmForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Prop Firms ({firms.length})</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          <Plus className="h-4 w-4" /> Add Prop Firm
        </button>
      </div>
      <div className="space-y-2">
        {firms.map((firm) => (
          <div key={firm.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <div className="flex items-center gap-4">
              {firm.logoUrl && <img src={firm.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />}
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{firm.name}</h3>
                <p className="text-xs" style={{ color: "#6b7280" }}>/prop-firms/{firm.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm flex items-center gap-1" style={{ color: "#2bb32a" }}><Star className="h-3.5 w-3.5 fill-current" /> {Number(firm.rating || 0).toFixed(1)}</span>
              <button onClick={() => setEditing(firm)} className="p-2 rounded-lg hover:bg-gray-100"><Pencil className="h-4 w-4" style={{ color: "#6b7280" }} /></button>
              <button onClick={() => handleDelete(firm.slug)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropFirmForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<any>(initial || {
    name: "", slug: "", tagline: "", profitSplit: "", maxFundingSize: "", evaluationFee: "",
    challengeTypes: "", profitTarget: "", dailyDrawdown: "", maxDrawdown: "", payoutFrequency: "",
    rating: "4.0", content: "", seoTitle: "", seoDescription: "", affiliateLink: "",
    discountCode: "", discountAmount: "", logoUrl: "", headquarters: "", yearFounded: "",
    pros: [], cons: [], highlights: [],
  });

  const [prosText, setProsText] = useState((form.pros || []).join("\n"));
  const [consText, setConsText] = useState((form.cons || []).join("\n"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      pros: prosText.split("\n").map((s: string) => s.trim()).filter(Boolean),
      cons: consText.split("\n").map((s: string) => s.trim()).filter(Boolean),
    });
  };

  const Field = ({ label, field, rows }: { label: string; field: string; rows?: number }) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>{label}</label>
      {rows ? (
        <textarea value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })} rows={rows}
          className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
      ) : (
        <input value={form[field] || ""} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{initial ? `Edit ${initial.name}` : "Add Prop Firm"}</h1>
        <button onClick={onCancel} className="text-sm" style={{ color: "#6b7280" }}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" field="name" />
            <Field label="Slug" field="slug" />
            <Field label="Rating" field="rating" />
            <Field label="Logo URL" field="logoUrl" />
          </div>
          <Field label="Tagline" field="tagline" />
          <Field label="Affiliate Link" field="affiliateLink" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Code" field="discountCode" />
            <Field label="Discount Amount" field="discountAmount" />
          </div>
        </div>
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Challenge Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Profit Split" field="profitSplit" />
            <Field label="Max Funding Size" field="maxFundingSize" />
            <Field label="Evaluation Fee" field="evaluationFee" />
            <Field label="Challenge Types" field="challengeTypes" />
            <Field label="Profit Target" field="profitTarget" />
            <Field label="Daily Drawdown" field="dailyDrawdown" />
            <Field label="Max Drawdown" field="maxDrawdown" />
            <Field label="Payout Frequency" field="payoutFrequency" />
            <Field label="Headquarters" field="headquarters" />
            <Field label="Year Founded" field="yearFounded" />
          </div>
        </div>
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Content</h2>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Pros (one per line)</label>
            <textarea value={prosText} onChange={(e) => setProsText(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Cons (one per line)</label>
            <textarea value={consText} onChange={(e) => setConsText(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
          <Field label="Review Content (HTML)" field="content" rows={12} />
        </div>
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>SEO</h2>
          <Field label="SEO Title" field="seoTitle" />
          <Field label="SEO Description" field="seoDescription" rows={3} />
        </div>
        <button type="submit" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          {initial ? "Save Changes" : "Create Prop Firm"}
        </button>
      </form>
    </div>
  );
}
