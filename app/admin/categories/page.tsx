"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AdminContext";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [propFirms, setPropFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchAll = async () => {
    const [catRes, brokerRes, firmRes] = await Promise.all([
      fetch("/api/admin/categories", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/brokers"),
      fetch("/api/brokers"), // placeholder — will use prop-firms endpoint
    ]);
    const cats = await catRes.json();
    const brokersData = await brokerRes.json();
    if (Array.isArray(cats)) setCategories(cats);
    if (Array.isArray(brokersData)) setBrokers(brokersData);
    // Fetch prop firms too
    const firmRes2 = await fetch("/api/admin/prop-firms", { headers: { Authorization: `Bearer ${token}` } });
    const firmsData = await firmRes2.json();
    if (Array.isArray(firmsData)) setPropFirms(firmsData);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const handleSave = async (formData: any) => {
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/admin/categories", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setShowForm(false); setEditing(null); fetchAll(); }
    else { const err = await res.json(); alert(err.error || "Save failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  if (loading) return <div className="flex items-center gap-2" style={{ color: "#6b7280" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  if (showForm || editing) {
    return (
      <CategoryForm
        initial={editing}
        brokers={brokers}
        propFirms={propFirms}
        onSave={handleSave}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Categories ({categories.length})</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
        Categories create flat SEO pages like <strong>/best-ecn-brokers</strong>. Create a category, assign brokers or prop firms, and the page auto-generates.
      </p>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4" style={{ color: "#2bb32a" }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{cat.name}</h3>
                <p className="text-xs" style={{ color: "#6b7280" }}>/{cat.slug} · {cat.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(cat)} className="p-2 rounded-lg hover:bg-gray-100"><Pencil className="h-4 w-4" style={{ color: "#6b7280" }} /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryForm({ initial, brokers, propFirms, onSave, onCancel }: {
  initial: any; brokers: any[]; propFirms: any[]; onSave: (data: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<any>(initial || { name: "", slug: "", type: "broker", description: "", sortOrder: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const entities = form.type === "broker" ? brokers : propFirms;

  const toggleEntity = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      ...(initial ? { id: initial.id } : {}),
      entityIds: selectedIds,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{initial ? "Edit Category" : "New Category"}</h1>
        <button onClick={onCancel} className="text-sm" style={{ color: "#6b7280" }}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Best ECN Brokers"
                className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>URL Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g., best-ecn-brokers"
                className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>This becomes the page URL: /{form.slug || "..."}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Type</label>
            <select value={form.type} onChange={(e) => { setForm({ ...form, type: e.target.value }); setSelectedIds([]); }}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }}>
              <option value="broker">Broker</option>
              <option value="prop_firm">Prop Firm</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Description</label>
            <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }} />
          </div>
        </div>

        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>
            Assign {form.type === "broker" ? "Brokers" : "Prop Firms"} ({selectedIds.length} selected)
          </h2>
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {entities.map((entity: any) => (
              <label key={entity.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entity.id)}
                  onChange={() => toggleEntity(entity.id)}
                  className="accent-[#2bb32a]"
                />
                <span className="text-sm" style={{ color: "#374151" }}>{entity.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          {initial ? "Save Changes" : "Create Category"}
        </button>
      </form>
    </div>
  );
}
