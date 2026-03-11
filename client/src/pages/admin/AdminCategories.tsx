import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, ActionBtn } from "@/lib/adminTheme";
import { Tag, Plus, Pencil, Trash2, RefreshCw, Check, X } from "lucide-react";

type CategoryType = "article" | "broker" | "prop_firm";

interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  description?: string;
  sortOrder?: number;
  wpId?: number;
}

const TYPE_LABELS: Record<CategoryType, string> = {
  article: "Article",
  broker: "Broker",
  prop_firm: "Prop Firm",
};

const TYPE_COLOR: Record<CategoryType, string> = {
  article: C.info,
  broker: C.accent,
  prop_firm: C.warning,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function InlineEdit({
  category,
  onDone,
}: {
  category: Category;
  onDone: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description || "");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/admin/categories/${category.id}`, { name, slug, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      onDone();
    },
  });

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
      <input
        value={name}
        onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
        style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none" }}
        autoFocus
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12, fontFamily: font, outline: "none" }}
        placeholder="slug"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ flex: 2, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12, fontFamily: font, outline: "none" }}
        placeholder="Description (optional)"
      />
      <button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending || !name}
        style={{ background: C.accent, border: "none", borderRadius: 6, color: C.bg, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
        data-testid="button-save-category"
      >
        <Check size={14} />
      </button>
      <button
        onClick={onDone}
        style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
        data-testid="button-cancel-edit"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function NewCategoryRow({
  defaultType,
  onDone,
}: {
  defaultType: CategoryType;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);
  const [description, setDescription] = useState("");
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/categories", { name, slug, type, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      onDone();
    },
  });

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 16px", background: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 8, marginBottom: 8 }}>
      <input
        value={name}
        onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
        placeholder="Category name"
        style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.accent}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none" }}
        autoFocus
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug"
        style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12, fontFamily: font, outline: "none" }}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as CategoryType)}
        style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, fontFamily: font }}
      >
        <option value="article">Article</option>
        <option value="broker">Broker</option>
        <option value="prop_firm">Prop Firm</option>
      </select>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        style={{ flex: 2, padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.textMuted, fontSize: 12, fontFamily: font, outline: "none" }}
      />
      <button
        onClick={() => createMutation.mutate()}
        disabled={createMutation.isPending || !name || !slug}
        style={{ background: C.accent, border: "none", borderRadius: 6, color: C.bg, padding: "6px 12px", cursor: !name || !slug ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, fontFamily: font, opacity: !name || !slug ? 0.5 : 1 }}
        data-testid="button-create-category"
      >
        {createMutation.isPending ? "Adding..." : "Add"}
      </button>
      <button
        onClick={onDone}
        style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function AdminCategories() {
  const [activeType, setActiveType] = useState<CategoryType | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState("");
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: () => fetch("/api/admin/categories", { credentials: "include" }).then((r) => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/categories"] }),
  });

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrateMsg("");
    try {
      const r = await apiRequest("POST", "/api/admin/migrate-categories");
      const data = await r.json();
      setMigrateMsg(data.inserted === 0 ? "All categories already migrated." : `Imported ${data.inserted} categories from WordPress.`);
      qc.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    } catch {
      setMigrateMsg("Migration failed.");
    } finally {
      setMigrating(false);
    }
  };

  const filtered = activeType === "all" ? categories : categories.filter((c) => c.type === activeType);
  const grouped: Record<CategoryType, Category[]> = {
    article: categories.filter((c) => c.type === "article"),
    broker: categories.filter((c) => c.type === "broker"),
    prop_firm: categories.filter((c) => c.type === "prop_firm"),
  };

  const typeCounts = {
    all: categories.length,
    article: grouped.article.length,
    broker: grouped.broker.length,
    prop_firm: grouped.prop_firm.length,
  };

  const displayCategories = activeType === "all"
    ? (["article", "broker", "prop_firm"] as CategoryType[]).flatMap((t) => grouped[t])
    : filtered;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Tag size={18} color={C.accent} />
              <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>Categories</h1>
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>Manage article, broker, and prop firm taxonomy categories</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {migrateMsg && <span style={{ fontSize: 12, color: C.accent }}>{migrateMsg}</span>}
            <button
              onClick={handleMigrate}
              disabled={migrating}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, border: `1px solid ${C.borderLight}`, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: migrating ? "not-allowed" : "pointer", fontFamily: font }}
              data-testid="button-migrate-categories"
            >
              <RefreshCw size={13} style={{ animation: migrating ? "spin 1s linear infinite" : undefined }} />
              {migrating ? "Importing..." : "Import from WordPress"}
            </button>
            <ActionBtn
              label="New Category"
              primary
              onClick={() => { setShowNew(true); setEditingId(null); }}
              data-testid="button-new-category"
            />
          </div>
        </div>

        {/* Type filter tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
          {(["all", "article", "broker", "prop_firm"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              style={{
                padding: "9px 16px", background: "none", border: "none",
                borderBottom: `2px solid ${activeType === t ? C.accent : "transparent"}`,
                color: activeType === t ? C.accent : C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
                whiteSpace: "nowrap", transition: "all 0.15s",
              }}
              data-testid={`tab-${t}`}
            >
              {t === "all" ? "All" : TYPE_LABELS[t]} ({typeCounts[t]})
            </button>
          ))}
        </div>

        {/* New category row */}
        {showNew && (
          <NewCategoryRow
            defaultType={activeType === "all" ? "article" : activeType}
            onDone={() => setShowNew(false)}
          />
        )}

        {/* Table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Col headers */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 3fr auto", gap: 0, padding: "10px 16px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
            {["NAME", "SLUG", "TYPE", "DESCRIPTION", ""].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textDim, letterSpacing: "0.8px" }}>{h}</div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: C.textDim, fontSize: 13 }}>Loading...</div>
          ) : displayCategories.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ color: C.textDim, fontSize: 13, marginBottom: 12 }}>No categories yet.</div>
              <ActionBtn label="Create your first category" primary onClick={() => setShowNew(true)} />
            </div>
          ) : (
            displayCategories.map((cat, idx) => {
              const isEditing = editingId === cat.id;
              const isLastInGroup = idx < displayCategories.length - 1 && displayCategories[idx + 1].type !== cat.type;
              const isFirstInGroup = idx === 0 || displayCategories[idx - 1].type !== cat.type;

              return (
                <div key={cat.id}>
                  {/* Group header (when viewing all) */}
                  {activeType === "all" && isFirstInGroup && (
                    <div style={{ padding: "8px 16px 4px", background: C.bg, borderBottom: `1px solid ${C.border}`, borderTop: idx > 0 ? `1px solid ${C.border}` : undefined }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[cat.type], letterSpacing: "0.8px" }}>
                        {TYPE_LABELS[cat.type].toUpperCase()} CATEGORIES
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 3fr auto",
                      gap: 0,
                      padding: "11px 16px",
                      borderBottom: `1px solid ${C.border}`,
                      alignItems: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {isEditing ? (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <InlineEdit category={cat} onDone={() => setEditingId(null)} />
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace" }}>{cat.slug}</div>
                        <div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.4px",
                            padding: "2px 8px", borderRadius: 20, border: `1px solid ${TYPE_COLOR[cat.type]}22`,
                            color: TYPE_COLOR[cat.type], background: `${TYPE_COLOR[cat.type]}15`,
                          }}>
                            {TYPE_LABELS[cat.type]}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cat.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>—</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setEditingId(cat.id)}
                            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            data-testid={`button-edit-${cat.slug}`}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat.id); }}
                            style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.danger, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            data-testid={`button-delete-${cat.slug}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
