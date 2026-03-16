import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, ActionBtn } from "@/lib/adminTheme";
import { Check, Pencil, X, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StaticPageSeo {
  slug: string;
  label: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
}

const PAGE_URL_MAP: Record<string, string> = {
  "/signals":       "https://entrylab.io/signals",
  "/subscribe":     "https://entrylab.io/subscribe",
  "/success":       "https://entrylab.io/success",
  "/brokers":       "https://entrylab.io/brokers",
  "/prop-firms":    "https://entrylab.io/prop-firms",
  "/compare":       "https://entrylab.io/compare",
  "broker-news":    "https://entrylab.io/broker-news",
  "prop-firm-news": "https://entrylab.io/prop-firm-news",
  "broker-guides":  "https://entrylab.io/broker-guides",
  "prop-firm-guides":"https://entrylab.io/prop-firm-guides",
  "trading-tools":  "https://entrylab.io/trading-tools",
  "news":           "https://entrylab.io/news",
};

export default function AdminPages() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  const { data: entries = [], isLoading } = useQuery<StaticPageSeo[]>({
    queryKey: ["/api/admin/static-page-seo"],
    enabled: !!session,
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ slug, title, desc }: { slug: string; title: string; desc: string }) =>
      apiRequest("PUT", `/api/admin/static-page-seo/${encodeURIComponent(slug)}`, {
        seoTitle: title,
        seoDescription: desc,
      }),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/static-page-seo"] });
      setSaved(slug);
      setEditing(null);
      setTimeout(() => setSaved(null), 2500);
    },
  });

  if (sessionLoading) return null;
  if (!session) { navigate("/admin/login"); return null; }

  const startEdit = (entry: StaticPageSeo) => {
    setEditing(entry.slug);
    setDraftTitle(entry.seoTitle || "");
    setDraftDesc(entry.seoDescription || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraftTitle("");
    setDraftDesc("");
  };

  const save = (slug: string) => {
    mutation.mutate({ slug, title: draftTitle, desc: draftDesc });
  };

  const staticEntries = entries.filter((e) => e.slug.startsWith("/"));
  const archiveEntries = entries.filter((e) => !e.slug.startsWith("/"));

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>
            Static Page SEO
          </h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
            Manage SEO titles and meta descriptions for static pages and category archives. Changes take effect immediately.
          </p>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            <SeoSection
              title="Static Pages"
              entries={staticEntries}
              editing={editing}
              draftTitle={draftTitle}
              draftDesc={draftDesc}
              saved={saved}
              isSaving={mutation.isPending}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSave={save}
              onDraftTitle={setDraftTitle}
              onDraftDesc={setDraftDesc}
            />
            <div style={{ marginTop: 28 }}>
              <SeoSection
                title="Category Archive Pages"
                entries={archiveEntries}
                editing={editing}
                draftTitle={draftTitle}
                draftDesc={draftDesc}
                saved={saved}
                isSaving={mutation.isPending}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onSave={save}
                onDraftTitle={setDraftTitle}
                onDraftDesc={setDraftDesc}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

interface SeoSectionProps {
  title: string;
  entries: StaticPageSeo[];
  editing: string | null;
  draftTitle: string;
  draftDesc: string;
  saved: string | null;
  isSaving: boolean;
  onStartEdit: (e: StaticPageSeo) => void;
  onCancelEdit: () => void;
  onSave: (slug: string) => void;
  onDraftTitle: (v: string) => void;
  onDraftDesc: (v: string) => void;
}

function SeoSection({
  title, entries, editing, draftTitle, draftDesc, saved, isSaving,
  onStartEdit, onCancelEdit, onSave, onDraftTitle, onDraftDesc,
}: SeoSectionProps) {
  return (
    <div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px", textTransform: "uppercase", margin: "0 0 10px" }}>
        {title}
      </h3>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {entries.map((entry, idx) => {
          const isEditing = editing === entry.slug;
          const isSaved = saved === entry.slug;
          const pageUrl = PAGE_URL_MAP[entry.slug];
          const isLast = idx === entries.length - 1;
          return (
            <div
              key={entry.slug}
              data-testid={`row-static-seo-${entry.slug}`}
              style={{
                borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                background: isEditing ? "rgba(255,255,255,0.02)" : "transparent",
              }}
            >
              {/* Read row */}
              {!isEditing && (
                <div
                  style={{ display: "flex", alignItems: "flex-start", padding: "14px 16px", gap: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{entry.label}</span>
                      <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>
                        {entry.slug}
                      </span>
                      {pageUrl && (
                        <a href={pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, display: "flex", alignItems: "center" }}>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 2 }}>
                      <span style={{ color: C.textDim, marginRight: 6 }}>Title:</span>
                      {entry.seoTitle
                        ? <span style={{ color: C.text }}>{entry.seoTitle}</span>
                        : <span style={{ color: C.textDim, fontStyle: "italic" }}>Not set</span>
                      }
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>
                      <span style={{ color: C.textDim, marginRight: 6 }}>Desc:</span>
                      {entry.seoDescription
                        ? <span style={{ color: C.text }}>{entry.seoDescription.length > 100 ? entry.seoDescription.slice(0, 100) + "…" : entry.seoDescription}</span>
                        : <span style={{ color: C.textDim, fontStyle: "italic" }}>Not set</span>
                      }
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {isSaved && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.accent }}>
                        <Check size={13} /> Saved
                      </span>
                    )}
                    <ActionBtn onClick={() => onStartEdit(entry)} icon={<Pencil size={13} />} label="Edit" />
                  </div>
                </div>
              )}

              {/* Edit row */}
              {isEditing && (
                <div style={{ padding: "16px 16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{entry.label}</span>
                    <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>
                      {entry.slug}
                    </span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px", textTransform: "uppercase" }}>SEO TITLE</label>
                      <span style={{ fontSize: 11, color: draftTitle.length > 60 ? "#f59e0b" : C.textDim }}>{draftTitle.length}/60 chars</span>
                    </div>
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => onDraftTitle(e.target.value)}
                      placeholder="e.g. Best Forex Brokers 2026 | EntryLab"
                      data-testid={`input-seo-title-${entry.slug}`}
                      style={{
                        width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
                        background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                      onBlur={(e) => { e.target.style.borderColor = C.border; }}
                    />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px", textTransform: "uppercase" }}>META DESCRIPTION</label>
                      <span style={{ fontSize: 11, color: draftDesc.length > 160 ? "#ef4444" : draftDesc.length > 140 ? "#f59e0b" : C.textDim }}>{draftDesc.length}/160 chars</span>
                    </div>
                    <textarea
                      value={draftDesc}
                      onChange={(e) => onDraftDesc(e.target.value)}
                      rows={3}
                      placeholder="Compelling meta description for search engines…"
                      data-testid={`input-seo-desc-${entry.slug}`}
                      style={{
                        width: "100%", padding: "9px 12px", borderRadius: 7, border: `1px solid ${C.border}`,
                        background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none",
                        resize: "vertical", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                      onBlur={(e) => { e.target.style.borderColor = C.border; }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => onSave(entry.slug)}
                      disabled={isSaving}
                      data-testid={`btn-save-seo-${entry.slug}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: C.accent, color: "#000", fontSize: 13, fontWeight: 600, fontFamily: font,
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      <Check size={13} />
                      {isSaving ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      onClick={onCancelEdit}
                      data-testid={`btn-cancel-seo-${entry.slug}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 7, border: `1px solid ${C.border}`, cursor: "pointer",
                        background: "transparent", color: C.textMuted, fontSize: 13, fontFamily: font,
                      }}
                    >
                      <X size={13} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
