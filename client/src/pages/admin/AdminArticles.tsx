import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, StatusBadge, ActionBtn } from "@/lib/adminTheme";
import { format } from "date-fns";

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  status: string;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// WP-sourced articles have numeric-only IDs; DB articles have UUID format (with dashes)
function isWpArticle(id: string) { return /^\d+$/.test(id); }

export default function AdminArticles() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: articlesRaw, isLoading } = useQuery<ArticleRow[]>({
    queryKey: ["/api/admin/articles"],
    enabled: !!session,
  });

  const articles = (Array.isArray(articlesRaw) ? articlesRaw : []).filter((a) =>
    !search.trim() || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (sessionLoading) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
          <div style={{ flex: "0 0 auto" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>Blog Posts</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              SEO articles, guides, broker comparisons, and editorial content
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto", maxWidth: 440 }}>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-article-search"
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; }}
            />
            <Link href="/admin/posts/new">
              <ActionBtn label="+ New Post" primary />
            </Link>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading...</div>
          ) : !articles || articles.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 16 }}>No posts yet. Create your first one.</p>
              <Link href="/admin/posts/new">
                <ActionBtn label="+ New Post" primary />
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Title", "Category", "Status", "Date", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    data-testid={`row-article-${article.id}`}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{article.title}</span>
                      <span style={{ display: "block", fontSize: 11, color: C.textDim, marginTop: 2 }}>{article.slug}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {article.category ? (
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: "rgba(75,156,242,0.1)", color: C.info, border: "1px solid rgba(75,156,242,0.2)", textTransform: "capitalize",
                        }}>
                          {article.category}
                        </span>
                      ) : (
                        <span style={{ color: C.textDim, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={article.status} />
                    </td>
                    <td style={{ padding: "14px 16px", color: C.textDim, fontSize: 12 }}>
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), "MMM d, yyyy")
                        : format(new Date(article.createdAt), "MMM d, yyyy")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Link href={`/admin/posts/${article.id}/edit`}>
                          <ActionBtn label="Edit" small />
                        </Link>
                        {!isWpArticle(article.id) && (
                          <ActionBtn
                            label="Delete"
                            small
                            danger
                            onClick={() => handleDelete(article.id, article.title)}
                            disabled={deleteMutation.isPending}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
