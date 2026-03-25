"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AdminContext";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";

export default function AdminBrokersPage() {
  const { token } = useAuth();
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchBrokers = async () => {
    const res = await fetch("/api/admin/brokers", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setBrokers(data);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchBrokers(); }, [token]);

  const handleSave = async (formData: any) => {
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/admin/brokers", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      fetchBrokers();
    } else {
      const err = await res.json();
      alert(err.error || "Save failed");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this broker?")) return;
    await fetch(`/api/admin/brokers?slug=${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBrokers();
  };

  if (loading) return <div className="flex items-center gap-2" style={{ color: "#6b7280" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading brokers...</div>;

  if (showForm || editing) {
    return <BrokerForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Brokers ({brokers.length})</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#2bb32a" }}
        >
          <Plus className="h-4 w-4" /> Add Broker
        </button>
      </div>

      <div className="space-y-2">
        {brokers.map((broker) => (
          <div key={broker.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <div className="flex items-center gap-4">
              {broker.logoUrl && <img src={broker.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />}
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{broker.name}</h3>
                <p className="text-xs" style={{ color: "#6b7280" }}>/brokers/{broker.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm flex items-center gap-1" style={{ color: "#2bb32a" }}>
                <Star className="h-3.5 w-3.5 fill-current" /> {Number(broker.rating || 0).toFixed(1)}
              </span>
              <button onClick={() => setEditing(broker)} className="p-2 rounded-lg hover:bg-gray-100">
                <Pencil className="h-4 w-4" style={{ color: "#6b7280" }} />
              </button>
              <button onClick={() => handleDelete(broker.slug)} className="p-2 rounded-lg hover:bg-red-50">
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrokerForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<any>(initial || {
    name: "", slug: "", tagline: "", regulation: "", minDeposit: "", maxLeverage: "",
    spreadFrom: "", platforms: "", paymentMethods: "", headquarters: "", yearFounded: "",
    withdrawalTime: "", support: "", rating: "4.0", content: "", seoTitle: "", seoDescription: "",
    affiliateLink: "", bonusOffer: "", bestFor: "", logoUrl: "",
    pros: [], cons: [], highlights: [],
  });

  const [prosText, setProsText] = useState((form.pros || []).join("\n"));
  const [consText, setConsText] = useState((form.cons || []).join("\n"));
  const [highlightsText, setHighlightsText] = useState((form.highlights || []).join("\n"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      pros: prosText.split("\n").map((s: string) => s.trim()).filter(Boolean),
      cons: consText.split("\n").map((s: string) => s.trim()).filter(Boolean),
      highlights: highlightsText.split("\n").map((s: string) => s.trim()).filter(Boolean),
    });
  };

  const Field = ({ label, field, type = "text", rows }: { label: string; field: string; type?: string; rows?: number }) => (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>{label}</label>
      {rows ? (
        <textarea
          value={form[field] || ""}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          rows={rows}
          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30"
          style={{ borderColor: "#e8edea" }}
        />
      ) : (
        <input
          type={type}
          value={form[field] || ""}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30"
          style={{ borderColor: "#e8edea" }}
        />
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{initial ? `Edit ${initial.name}` : "Add Broker"}</h1>
        <button onClick={onCancel} className="text-sm" style={{ color: "#6b7280" }}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Basic Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" field="name" />
            <Field label="Slug" field="slug" />
            <Field label="Rating (1-5)" field="rating" type="number" />
            <Field label="Logo URL" field="logoUrl" />
          </div>
          <Field label="Tagline" field="tagline" />
          <Field label="Affiliate Link" field="affiliateLink" />
          <Field label="Bonus Offer" field="bonusOffer" />
        </div>

        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Trading Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Regulation" field="regulation" />
            <Field label="Min Deposit" field="minDeposit" />
            <Field label="Max Leverage" field="maxLeverage" />
            <Field label="Spread From" field="spreadFrom" />
            <Field label="Platforms" field="platforms" />
            <Field label="Payment Methods" field="paymentMethods" />
            <Field label="Headquarters" field="headquarters" />
            <Field label="Year Founded" field="yearFounded" />
            <Field label="Withdrawal Time" field="withdrawalTime" />
            <Field label="Support" field="support" />
            <Field label="Best For" field="bestFor" />
          </div>
        </div>

        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>Content</h2>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Pros (one per line)</label>
            <textarea value={prosText} onChange={(e) => setProsText(e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Cons (one per line)</label>
            <textarea value={consText} onChange={(e) => setConsText(e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Highlights (one per line)</label>
            <textarea value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
          <Field label="Review Content (HTML)" field="content" rows={12} />
        </div>

        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>SEO</h2>
          <Field label="SEO Title" field="seoTitle" />
          <Field label="SEO Description" field="seoDescription" rows={3} />
        </div>

        <button type="submit" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          {initial ? "Save Changes" : "Create Broker"}
        </button>
      </form>
    </div>
  );
}
