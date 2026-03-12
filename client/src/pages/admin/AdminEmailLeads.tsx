import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font } from "@/lib/adminTheme";
import { format } from "date-fns";
import { Search, Download, Trash2 } from "lucide-react";

interface EmailLead {
  id: string;
  email: string;
  source: string | null;
  utmCampaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminEmailLeads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data: leads = [], isLoading } = useQuery<EmailLead[]>({
    queryKey: ["/api/admin/email-leads"],
  });

  const sources = useMemo(() => {
    const set = new Set(leads.map(l => l.source || "unknown"));
    return ["all", ...Array.from(set).sort()];
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search || l.email.toLowerCase().includes(search.toLowerCase());
      const matchSource = sourceFilter === "all" || (l.source || "unknown") === sourceFilter;
      return matchSearch && matchSource;
    });
  }, [leads, search, sourceFilter]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/email-leads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/email-leads"] }),
  });

  const handleExportCSV = () => {
    const headers = ["Email", "Source", "UTM Campaign", "UTM Source", "UTM Medium", "UTM Content", "UTM Term", "GCLID", "FBCLID", "IP Address", "Signed Up"];
    const rows = filtered.map(l => [
      l.email,
      l.source || "",
      l.utmCampaign || "",
      l.utmSource || "",
      l.utmMedium || "",
      l.utmContent || "",
      l.utmTerm || "",
      l.gclid || "",
      l.fbclid || "",
      l.ipAddress || "",
      l.createdAt ? format(new Date(l.createdAt), "yyyy-MM-dd HH:mm") : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blog-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: font, margin: 0 }}>
            Blog Leads
          </h1>
          <p style={{ fontSize: 13, color: C.textDim, fontFamily: font, marginTop: 4 }}>
            {leads.length.toLocaleString()} total subscribers
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          data-testid="button-export-csv"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: C.accent, color: "#0B0E11",
            border: "none", borderRadius: 6, padding: "8px 16px",
            fontSize: 13, fontWeight: 600, fontFamily: font,
            cursor: "pointer",
          }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textDim }} />
          <input
            data-testid="input-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12, height: 36,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 6, color: C.text, fontSize: 13, fontFamily: font,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Source filter */}
        <select
          data-testid="select-source-filter"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{
            height: 36, padding: "0 12px", background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 6,
            color: C.text, fontSize: 13, fontFamily: font, cursor: "pointer",
          }}
        >
          {sources.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Sources" : s}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Showing", value: filtered.length.toLocaleString() },
          { label: "Total", value: leads.length.toLocaleString() },
          { label: "Sources", value: (sources.length - 1).toString() },
        ].map(stat => (
          <div key={stat.label} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "10px 16px", minWidth: 100,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.accent, fontFamily: font }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: font, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 130px 130px 90px 36px",
          gap: 0,
          background: C.bg,
          borderBottom: `1px solid ${C.border}`,
          padding: "8px 16px",
        }}>
          {["Email", "Source", "UTM Campaign", "UTM Source", "Signed Up", ""].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: C.textDim, fontFamily: font, letterSpacing: "0.5px" }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: C.textDim, fontFamily: font, fontSize: 13 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: C.textDim, fontFamily: font, fontSize: 13 }}>
            {search || sourceFilter !== "all" ? "No leads match your filters." : "No leads yet."}
          </div>
        ) : (
          <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
            {filtered.map((lead, i) => (
              <div
                key={lead.id}
                data-testid={`row-lead-${lead.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 130px 130px 90px 36px",
                  gap: 0,
                  padding: "10px 16px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.surfaceHover}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div style={{ fontSize: 13, color: C.text, fontFamily: font, wordBreak: "break-all", paddingRight: 8 }}>
                  {lead.email}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>
                  {lead.source || <span style={{ color: C.textDim, fontStyle: "italic" }}>—</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>
                  {lead.utmCampaign || <span style={{ color: C.textDim }}>—</span>}
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>
                  {lead.utmSource || <span style={{ color: C.textDim }}>—</span>}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, fontFamily: font }}>
                  {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yy") : "—"}
                </div>
                <button
                  data-testid={`button-delete-lead-${lead.id}`}
                  onClick={() => {
                    if (window.confirm(`Remove ${lead.email}?`)) deleteMutation.mutate(lead.id);
                  }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: C.textDim, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 4, padding: 4,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textDim}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
