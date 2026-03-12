import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, StatusBadge, ActionBtn } from "@/lib/adminTheme";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  link: string;
  date: string;
  modified: string;
}

const KNOWN_APP_ROUTES: Record<string, string> = {
  home: "/",
  signals: "/signals",
  subscribe: "/signals",
  "payment-success": "/signals",
};

export default function AdminPages() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: pagesRaw, isLoading } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
    enabled: !!session,
  });

  const pages = (Array.isArray(pagesRaw) ? pagesRaw : []).filter((p) =>
    !search.trim() || p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (sessionLoading) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16 }}>
          <div style={{ flex: "0 0 auto" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>Pages</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              Static pages — Home, Signals, Subscribe, etc.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto", maxWidth: 400 }}>
            <input
              type="text"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-page-search"
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 7, border: `1px solid ${C.border}`,
                background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = C.accent; }}
              onBlur={(e) => { e.target.style.borderColor = C.border; }}
            />
          </div>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading...</div>
          ) : pages.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: C.textMuted }}>No pages found.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Title", "App Route", "Status", "Last Modified", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const appRoute = KNOWN_APP_ROUTES[page.slug];
                  return (
                    <tr
                      key={page.id}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      data-testid={`row-page-${page.id}`}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{page.title}</span>
                        <span style={{ display: "block", fontSize: 11, color: C.textDim, marginTop: 2 }}>{page.slug}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {appRoute ? (
                          <span style={{
                            display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: "rgba(8,242,149,0.08)", color: C.accent, border: `1px solid rgba(8,242,149,0.2)`,
                          }}>
                            {appRoute}
                          </span>
                        ) : (
                          <span style={{ color: C.textDim, fontSize: 12 }}>External</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={page.status} />
                      </td>
                      <td style={{ padding: "14px 16px", color: C.textDim, fontSize: 12 }}>
                        {page.modified ? format(new Date(page.modified), "MMM d, yyyy") : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <a
                          href={page.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: C.accent, textDecoration: "none" }}
                        >
                          <ExternalLink size={12} />
                          View
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: C.textDim }}>
          Static pages are managed directly in the admin panel.
        </p>
      </div>
    </AdminLayout>
  );
}
