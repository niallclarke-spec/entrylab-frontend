import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, ActionBtn } from "@/lib/adminTheme";
import RichTextEditor from "@/components/admin/RichTextEditor";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
  relatedBroker: string;
  relatedPropFirm: string;
}

const empty: ArticleForm = {
  title: "", slug: "", excerpt: "", content: "", category: "",
  status: "draft", featuredImage: "", seoTitle: "", seoDescription: "", author: "EntryLab",
  relatedBroker: "", relatedPropFirm: "",
};

function DInput({ placeholder, value, onChange, type = "text", large = false }: {
  placeholder?: string; value: string; onChange: (v: string) => void; type?: string; large?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: large ? "12px 14px" : "10px 14px", borderRadius: 7,
        border: `1px solid ${C.border}`, background: C.bg, color: C.text,
        fontSize: large ? 16 : 13, fontWeight: large ? 600 : 400,
        fontFamily: large ? font : font, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
      }}
      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; }}
    />
  );
}

function DTextArea({ placeholder, value, onChange, rows = 4, mono = false }: {
  placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: 7, border: `1px solid ${C.border}`,
        background: C.bg, color: C.text, fontSize: 13, fontFamily: mono ? "monospace" : font,
        outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6,
      }}
      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; }}
    />
  );
}

function SidePanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8, letterSpacing: "0.3px" }}>
      {children}
    </label>
  );
}

function DSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border}`,
        background: C.bg, color: C.text, fontSize: 13, fontFamily: font,
        outline: "none", boxSizing: "border-box", appearance: "none",
      }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function FirmPickerPanel({
  label,
  value,
  onChange,
  items,
  getLogoUrl,
  getSlug,
  getName,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: any[];
  getLogoUrl: (item: any) => string;
  getSlug: (item: any) => string;
  getName: (item: any) => string;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selected = items.find((i) => getSlug(i) === value);
  const filtered = items.filter((i) =>
    getName(i).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <PanelLabel>{label}</PanelLabel>

      {/* Selected preview */}
      {selected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.bg, border: `1px solid ${C.accent}`, borderRadius: 8, marginBottom: 8 }}>
          {getLogoUrl(selected) ? (
            <img src={getLogoUrl(selected)} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, background: "#fff", padding: 2 }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 6, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.textMuted }}>
              {getName(selected)[0]}
            </div>
          )}
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{getName(selected)}</span>
          <button
            onClick={() => onChange("")}
            style={{ fontSize: 12, color: C.danger, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}
          >
            Remove
          </button>
        </div>
      ) : null}

      {/* Search input */}
      <input
        placeholder={placeholder}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
          background: C.bg, color: C.text, fontSize: 13, fontFamily: font,
          outline: "none", boxSizing: "border-box",
        }}
      />

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
          maxHeight: 220, overflowY: "auto", marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          <div
            style={{ padding: "8px 12px", fontSize: 12, color: C.textMuted, cursor: "pointer", borderBottom: `1px solid ${C.border}` }}
            onMouseDown={() => { onChange(""); setSearch(""); setOpen(false); }}
          >
            — None —
          </div>
          {filtered.map((item) => (
            <div
              key={getSlug(item)}
              onMouseDown={() => { onChange(getSlug(item)); setSearch(""); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                background: getSlug(item) === value ? C.accent + "22" : "transparent",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = C.accent + "11"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = getSlug(item) === value ? C.accent + "22" : "transparent"; }}
            >
              {getLogoUrl(item) ? (
                <img src={getLogoUrl(item)} alt="" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 5, background: "#fff", padding: 2 }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 5, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textMuted }}>
                  {getName(item)[0]}
                </div>
              )}
              <span style={{ fontSize: 13, color: C.text }}>{getName(item)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminArticleEditor() {
  const params = useParams<{ id?: string }>();
  const articleId = params.id;
  const isNew = !articleId;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ArticleForm>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: existing, isLoading: articleLoading } = useQuery<any>({
    queryKey: ["/api/admin/articles", articleId],
    queryFn: () => fetch(`/api/admin/articles/${articleId}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !isNew && !!session,
  });

  const { data: brokersData } = useQuery<any[]>({
    queryKey: ["/api/brokers"],
    enabled: !!session,
  });

  const { data: propFirmsData } = useQuery<any[]>({
    queryKey: ["/api/prop-firms"],
    enabled: !!session,
  });

  const brokers = brokersData || [];
  const propFirms = propFirmsData || [];

  useEffect(() => {
    if (existing && !articleLoading) {
      setForm({
        title: existing.title || "", slug: existing.slug || "", excerpt: existing.excerpt || "",
        content: existing.content || "", category: existing.category || "", status: existing.status || "draft",
        featuredImage: existing.featuredImage || "", seoTitle: existing.seoTitle || "",
        seoDescription: existing.seoDescription || "", author: existing.author || "EntryLab",
        relatedBroker: existing.relatedBroker || "", relatedPropFirm: existing.relatedPropFirm || "",
      });
      setSlugTouched(true);
    }
  }, [existing, articleLoading]);

  const setField = (key: keyof ArticleForm, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleTitleChange = (val: string) => {
    setForm((f) => ({ ...f, title: val, slug: slugTouched ? f.slug : slugify(val) }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        relatedBroker: form.relatedBroker || null,
        relatedPropFirm: form.relatedPropFirm || null,
      };
      if (isNew) return apiRequest("POST", "/api/admin/articles", payload);
      return apiRequest("PUT", `/api/admin/articles/${articleId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      navigate("/admin/pages");
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to save. Slug may already exist.");
    },
  });

  if (sessionLoading || (!isNew && articleLoading)) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/admin/pages")}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "6px 12px", cursor: "pointer", fontSize: 14 }}
            >
              ←
            </button>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>
                {isNew ? "New Page" : "Edit Page"}
              </h2>
              <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
                Create a ranked list, guide, or editorial page
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {saveError && <span style={{ fontSize: 12, color: C.danger }}>{saveError}</span>}
            <ActionBtn label="Cancel" onClick={() => navigate("/admin/pages")} />
            <ActionBtn
              label={saveMutation.isPending ? "Saving..." : "Save"}
              primary
              onClick={() => { setSaveError(""); saveMutation.mutate(); }}
              disabled={saveMutation.isPending || !form.title}
            />
          </div>
        </div>

        {/* 2-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          {/* Left — main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              {/* Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, display: "block", letterSpacing: "0.3px" }}>PAGE TITLE</label>
                <DInput
                  placeholder="e.g. Best Prop Firms for Beginners 2026"
                  value={form.title}
                  onChange={handleTitleChange}
                  large
                />
              </div>
              {/* Slug */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, display: "block", letterSpacing: "0.3px" }}>SLUG</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ padding: "10px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRight: "none", borderRadius: "7px 0 0 7px", color: C.textDim, fontSize: 13, whiteSpace: "nowrap" }}>
                    {form.relatedBroker
                      ? `entrylab.io/broker/${form.relatedBroker}/`
                      : form.relatedPropFirm
                      ? `entrylab.io/prop-firm/${form.relatedPropFirm}/`
                      : form.category
                      ? `entrylab.io/${form.category}/`
                      : "entrylab.io/"}
                  </span>
                  <input
                    placeholder="article-slug"
                    value={form.slug}
                    onChange={(e) => { setSlugTouched(true); setField("slug", e.target.value); }}
                    style={{ flex: 1, padding: "10px 14px", border: `1px solid ${C.border}`, borderRadius: "0 7px 7px 0", background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                    onBlur={(e) => { e.target.style.borderColor = C.border; }}
                  />
                </div>
              </div>
              {/* Excerpt */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, display: "block", letterSpacing: "0.3px" }}>EXCERPT</label>
                <DTextArea placeholder="Short summary shown in article listings..." value={form.excerpt} onChange={(v) => setField("excerpt", v)} rows={2} />
              </div>
              {/* Body */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, display: "block", letterSpacing: "0.3px" }}>BODY CONTENT</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => setField("content", v)}
                  placeholder="Write your page content here..."
                />
              </div>
            </div>

            {/* Author */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8, display: "block", letterSpacing: "0.3px" }}>AUTHOR</label>
              <DInput placeholder="EntryLab" value={form.author} onChange={(v) => setField("author", v)} />
            </div>
          </div>

          {/* Right — sidebar panels */}
          <div>
            <SidePanel>
              <PanelLabel>PAGE TYPE / CATEGORY</PanelLabel>
              <DSelect
                value={form.category}
                onChange={(v) => setField("category", v)}
                options={[
                  { value: "", label: "Select category..." },
                  { value: "prop-firms", label: "Prop Firms" },
                  { value: "brokers", label: "Brokers" },
                  { value: "analysis", label: "Analysis" },
                  { value: "news", label: "News" },
                  { value: "guide", label: "Guide" },
                  { value: "comparison", label: "Comparison" },
                ]}
              />
              <div style={{ height: 14 }} />
              <PanelLabel>STATUS</PanelLabel>
              <DSelect
                value={form.status}
                onChange={(v) => setField("status", v)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "scheduled", label: "Scheduled" },
                ]}
              />
            </SidePanel>

            {/* Parent entity — controls nested URL + inline card in article */}
            <SidePanel>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>PARENT ENTITY</div>
              <p style={{ fontSize: 11, color: C.textDim, marginBottom: 14, lineHeight: 1.5 }}>
                Linking to a broker or prop firm nests this article under their URL
                (e.g. <span style={{ color: C.accent, fontFamily: "monospace" }}>/broker/[slug]/[article]</span>)
                and embeds their card inside the content. Pick one or neither.
              </p>
              <div style={{ marginBottom: 16 }}>
                <FirmPickerPanel
                  label="PARENT BROKER"
                  value={form.relatedBroker}
                  onChange={(v) => {
                    setField("relatedBroker", v);
                    if (v) setField("relatedPropFirm", "");
                  }}
                  items={brokers}
                  getLogoUrl={(b) => b.logoUrl || b.logo || ""}
                  getSlug={(b) => b.slug}
                  getName={(b) => b.name}
                  placeholder="Search brokers..."
                />
              </div>
              <FirmPickerPanel
                label="PARENT PROP FIRM"
                value={form.relatedPropFirm}
                onChange={(v) => {
                  setField("relatedPropFirm", v);
                  if (v) setField("relatedBroker", "");
                }}
                items={propFirms}
                getLogoUrl={(p) => p.logoUrl || p.logo || ""}
                getSlug={(p) => p.slug}
                getName={(p) => p.name}
                placeholder="Search prop firms..."
              />
              {(form.relatedBroker || form.relatedPropFirm) && (
                <div style={{ marginTop: 12, padding: "8px 10px", background: C.accent + "15", border: `1px solid ${C.accent}40`, borderRadius: 7 }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 2 }}>URL PREVIEW</div>
                  <div style={{ fontSize: 11, color: C.text, fontFamily: "monospace", wordBreak: "break-all" }}>
                    {form.relatedBroker
                      ? `entrylab.io/broker/${form.relatedBroker}/${form.slug || "[slug]"}`
                      : `entrylab.io/prop-firm/${form.relatedPropFirm}/${form.slug || "[slug]"}`}
                  </div>
                </div>
              )}
            </SidePanel>

            <SidePanel>
              <PanelLabel>SEO</PanelLabel>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: C.textDim, marginBottom: 4, display: "block" }}>Meta Title</label>
                <DInput placeholder="Best Prop Firms 2026 | EntryLab" value={form.seoTitle} onChange={(v) => setField("seoTitle", v)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.textDim, marginBottom: 4, display: "block" }}>Meta Description</label>
                <DTextArea
                  placeholder="Compelling description for search engines..."
                  value={form.seoDescription}
                  onChange={(v) => setField("seoDescription", v)}
                  rows={3}
                />
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                  {form.seoDescription.length}/160 characters
                </div>
              </div>
            </SidePanel>

            <SidePanel>
              <PanelLabel>FEATURED IMAGE URL</PanelLabel>
              <DInput placeholder="https://..." value={form.featuredImage} onChange={(v) => setField("featuredImage", v)} />
              {form.featuredImage && (
                <img src={form.featuredImage} alt="" style={{ width: "100%", borderRadius: 6, marginTop: 10, objectFit: "cover", maxHeight: 120 }} />
              )}
              {!form.featuredImage && (
                <div style={{ marginTop: 10, border: `2px dashed ${C.border}`, borderRadius: 8, padding: 24, textAlign: "center", color: C.textMuted, fontSize: 12 }}>
                  Paste image URL above
                </div>
              )}
            </SidePanel>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
