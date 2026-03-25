"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AdminContext";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminArticlesPage() {
  const { token } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchArticles = async () => {
    const res = await fetch("/api/admin/articles", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setArticles(data);
    setLoading(false);
  };

  useEffect(() => { if (token) fetchArticles(); }, [token]);

  const handleSave = async (formData: any) => {
    const method = editing ? "PUT" : "POST";
    const res = await fetch("/api/admin/articles", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) { setShowForm(false); setEditing(null); fetchArticles(); }
    else { const err = await res.json(); alert(err.error || "Save failed"); }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/admin/articles?slug=${slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchArticles();
  };

  if (loading) return <div className="flex items-center gap-2" style={{ color: "#6b7280" }}><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  if (showForm || editing) {
    return <ArticleForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>Articles ({articles.length})</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>
      <div className="space-y-2">
        {articles.map((article) => (
          <div key={article.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{article.title}</h3>
                {article.status === "published" ? (
                  <Eye className="h-3.5 w-3.5" style={{ color: "#2bb32a" }} />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" style={{ color: "#9ca3af" }} />
                )}
              </div>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {article.category || "uncategorized"} · {article.author || "EntryLab"}
                {article.relatedBroker && ` · Broker: ${article.relatedBroker}`}
                {article.relatedPropFirm && ` · Prop Firm: ${article.relatedPropFirm}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(article)} className="p-2 rounded-lg hover:bg-gray-100"><Pencil className="h-4 w-4" style={{ color: "#6b7280" }} /></button>
              <button onClick={() => handleDelete(article.slug)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState<any>(initial || {
    title: "", slug: "", excerpt: "", content: "", category: "news",
    status: "draft", author: "EntryLab", featuredImage: "",
    seoTitle: "", seoDescription: "", relatedBroker: "", relatedPropFirm: "",
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

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
        <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>{initial ? "Edit Article" : "New Article"}</h1>
        <button onClick={onCancel} className="text-sm" style={{ color: "#6b7280" }}>Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <Field label="Title" field="title" />
          <Field label="Slug" field="slug" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Category</label>
              <select value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }}>
                <option value="news">News</option>
                <option value="broker-news">Broker News</option>
                <option value="prop-firm-news">Prop Firm News</option>
                <option value="broker-guides">Broker Guides</option>
                <option value="prop-firm-guides">Prop Firm Guides</option>
                <option value="trading-tools">Trading Tools</option>
                <option value="">Uncategorized (Blog)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Status</label>
              <select value={form.status || "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#e8edea" }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <Field label="Author" field="author" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Related Broker (slug)" field="relatedBroker" />
            <Field label="Related Prop Firm (slug)" field="relatedPropFirm" />
          </div>
          <Field label="Featured Image URL" field="featuredImage" />
          <Field label="Excerpt" field="excerpt" rows={3} />
          <Field label="Content (HTML)" field="content" rows={20} />
        </div>
        <div className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
          <h2 className="font-semibold" style={{ color: "#111827" }}>SEO</h2>
          <Field label="SEO Title" field="seoTitle" />
          <Field label="SEO Description" field="seoDescription" rows={3} />
        </div>
        <button type="submit" className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
          {initial ? "Save Changes" : "Create Article"}
        </button>
      </form>
    </div>
  );
}
