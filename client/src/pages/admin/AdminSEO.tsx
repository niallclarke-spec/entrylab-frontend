import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, ActionBtn } from "@/lib/adminTheme";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3,
  Zap,
  Eye,
  MousePointerClick,
  Target,
  Activity,
} from "lucide-react";

// ─── URL labelling ─────────────────────────────────────────────────────────────

function labelUrl(url: string): { type: string; label: string; color: string } {
  const path = url.replace("https://entrylab.io", "").replace(/\/$/, "") || "/";
  if (path.match(/^\/broker\/[^/]+$/)) return { type: "broker", label: "Broker Review", color: C.info };
  if (path.match(/^\/prop-firm\/[^/]+$/)) return { type: "prop-firm", label: "Prop Firm Review", color: "#9b6cff" };
  if (path.match(/^\/compare\/broker\/.+-vs-.+$/)) return { type: "comparison", label: "Broker vs Broker", color: C.warning };
  if (path.match(/^\/compare\/prop-firm\/.+-vs-.+$/)) return { type: "comparison", label: "Prop Firm vs Prop Firm", color: C.warning };
  if (path.match(/^\/compare\/broker(\/)?$/)) return { type: "hub", label: "Broker Compare Hub", color: C.accent };
  if (path.match(/^\/compare\/prop-firm(\/)?$/)) return { type: "hub", label: "Prop Firm Compare Hub", color: C.accent };
  if (path === "/compare") return { type: "hub", label: "Compare Hub", color: C.accent };
  if (path === "/brokers") return { type: "hub", label: "Brokers Hub", color: C.accent };
  if (path === "/prop-firms") return { type: "hub", label: "Prop Firms Hub", color: C.accent };
  if (path === "/" || path === "") return { type: "home", label: "Homepage", color: C.accent };
  const articleMatch = path.match(/^\/([a-z-]+)\/([a-z0-9-]+)$/);
  if (articleMatch) {
    const cat = articleMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { type: "article", label: `Article · ${cat}`, color: "#f27e4b" };
  }
  return { type: "page", label: path, color: C.textMuted };
}

function shortUrl(url: string): string {
  return url.replace("https://entrylab.io", "") || "/";
}

function relTime(ts: string | null): string {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "18px 22px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={15} color={C.accent} />
        <span style={{ fontSize: 12, color: C.textMuted, fontFamily: font, fontWeight: 600, letterSpacing: "0.3px" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: font, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, fontFamily: font }}>{sub}</div>}
    </div>
  );
}

function TypePill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.3px",
      background: `${color}18`,
      color,
      border: `1px solid ${color}30`,
      whiteSpace: "nowrap" as const,
      fontFamily: font,
    }}>
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: C.accent,
    queued: C.warning,
    error: C.danger,
  };
  const color = map[status] || C.textDim;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: font }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: color, flexShrink: 0, display: "inline-block",
      }} />
      <span style={{ fontSize: 11, color, fontWeight: 600, textTransform: "capitalize" as const }}>{status}</span>
    </span>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "quick-wins" | "ctr-issues" | "log" | "submit";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "quick-wins", label: "Quick Wins", icon: Zap },
  { id: "ctr-issues", label: "CTR Issues", icon: TrendingDown },
  { id: "log", label: "Indexing Log", icon: Activity },
  { id: "submit", label: "Submit URL", icon: Send },
];

// ─── Table component ───────────────────────────────────────────────────────────

function PerfTable({ rows, emptyMsg }: {
  rows: any[];
  emptyMsg: string;
}) {
  if (!rows.length) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: C.textDim, fontFamily: font, fontSize: 13 }}>
        {emptyMsg}
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" as const }}>
      <table style={{ width: "100%", borderCollapse: "collapse" as const, fontFamily: font }}>
        <thead>
          <tr>
            {["URL", "Type", "Impressions", "Clicks", "CTR", "Position"].map((h) => (
              <th key={h} style={{
                textAlign: h === "URL" || h === "Type" ? "left" : "right" as const,
                padding: "8px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: C.textDim,
                letterSpacing: "0.4px",
                borderBottom: `1px solid ${C.border}`,
                whiteSpace: "nowrap" as const,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const { label, color } = labelUrl(row.url);
            return (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}20` }}>
                <td style={{ padding: "10px 12px", maxWidth: 320 }}>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: C.text,
                      textDecoration: "none",
                      fontSize: 12,
                      fontFamily: font,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 260 }}>
                      {shortUrl(row.url)}
                    </span>
                    <ExternalLink size={10} color={C.textDim} style={{ flexShrink: 0 }} />
                  </a>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <TypePill label={label} color={color} />
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 12, color: C.text, fontFamily: font }}>
                  {Number(row.impressions).toLocaleString()}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 12, color: C.text, fontFamily: font }}>
                  {Number(row.clicks).toLocaleString()}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 12, color: C.text, fontFamily: font }}>
                  {row.ctr_pct != null ? `${Number(row.ctr_pct).toFixed(1)}%` : "—"}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 12, fontFamily: font }}>
                  <span style={{
                    color: Number(row.position) <= 10 ? C.accent : Number(row.position) <= 20 ? C.warning : C.textMuted,
                    fontWeight: 600,
                  }}>
                    #{Number(row.position).toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdminSEO() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [submitPath, setSubmitPath] = useState("");
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; url: string; error?: string } | null>(null);
  const [days, setDays] = useState(28);

  const { data: status } = useQuery<{ enabled: boolean; property: string }>({
    queryKey: ["/api/admin/gsc/status"],
    staleTime: 60_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totals: any;
    topPages: any[];
  }>({
    queryKey: ["/api/admin/gsc/stats", days],
    queryFn: () => fetch(`/api/admin/gsc/stats?days=${days}`, { credentials: "include" }).then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<{
    quickWins: any[];
    ctrIssues: any[];
  }>({
    queryKey: ["/api/admin/gsc/insights", days],
    queryFn: () => fetch(`/api/admin/gsc/insights?days=${days}`, { credentials: "include" }).then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: log, isLoading: logLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/gsc/log"],
    queryFn: () => fetch(`/api/admin/gsc/log?limit=50`, { credentials: "include" }).then((r) => r.json()),
    staleTime: 30_000,
    enabled: activeTab === "log",
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/gsc/sync?days=${days}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/gsc/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/gsc/insights"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/gsc/log"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (path: string) => apiRequest("POST", "/api/admin/gsc/submit", { path }),
    onSuccess: (data: any) => {
      setSubmitResult(data);
      qc.invalidateQueries({ queryKey: ["/api/admin/gsc/log"] });
    },
  });

  const totals = stats?.totals || {};
  const topPages = stats?.topPages || [];
  const quickWins = insights?.quickWins || [];
  const ctrIssues = insights?.ctrIssues || [];
  const lastSynced = totals.last_synced_at ? relTime(totals.last_synced_at) : "never";
  const hasData = Number(totals.url_count || 0) > 0;

  return (
    <AdminLayout>
      <div style={{ padding: "28px 32px", fontFamily: font, maxWidth: 1200 }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>
              SEO Intelligence
            </h1>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "6px 0 0", fontFamily: font }}>
              {status?.enabled
                ? `Connected · ${status.property} · Last sync ${lastSynced}`
                : "GSC not configured — add GOOGLE_SERVICE_ACCOUNT_JSON secret to enable"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{
                padding: "7px 12px",
                borderRadius: 7,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 13,
                fontFamily: font,
                cursor: "pointer",
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={28}>Last 28 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <ActionBtn
              label={syncMutation.isPending ? "Syncing…" : "Sync Data"}
              primary
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !status?.enabled}
            />
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <StatCard icon={Eye} label="IMPRESSIONS" value={hasData ? Number(totals.total_impressions || 0).toLocaleString() : "—"} sub={`Last ${days} days`} />
          <StatCard icon={MousePointerClick} label="CLICKS" value={hasData ? Number(totals.total_clicks || 0).toLocaleString() : "—"} sub={`Last ${days} days`} />
          <StatCard icon={Target} label="AVG POSITION" value={hasData ? `#${Number(totals.avg_position || 0).toFixed(1)}` : "—"} sub="Lower is better" />
          <StatCard icon={BarChart3} label="PAGES TRACKED" value={hasData ? Number(totals.url_count || 0).toLocaleString() : "—"} sub="Unique URLs" />
        </div>

        {/* ── No-data notice ── */}
        {!hasData && !statsLoading && (
          <div style={{
            background: `${C.warning}12`,
            border: `1px solid ${C.warning}30`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <AlertCircle size={16} color={C.warning} />
            <div style={{ fontFamily: font }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>No GSC data yet</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                {status?.enabled
                  ? "Click \"Sync Data\" to pull your Search Console data. Note: GSC has a 2–3 day delay."
                  : "Add your GOOGLE_SERVICE_ACCOUNT_JSON secret and set GSC_PROPERTY to connect Search Console."}
              </div>
            </div>
          </div>
        )}

        {/* ── Insight pills ── */}
        {hasData && (
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div
              onClick={() => setActiveTab("quick-wins")}
              style={{
                background: quickWins.length ? `${C.accent}10` : C.surface,
                border: `1px solid ${quickWins.length ? C.accentBorder : C.border}`,
                borderRadius: 9,
                padding: "12px 18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Zap size={15} color={quickWins.length ? C.accent : C.textDim} />
              <span style={{ fontSize: 13, fontWeight: 700, color: quickWins.length ? C.accent : C.textMuted, fontFamily: font }}>
                {quickWins.length} Quick Win{quickWins.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>· positions 4–15</span>
            </div>
            <div
              onClick={() => setActiveTab("ctr-issues")}
              style={{
                background: ctrIssues.length ? `${C.danger}10` : C.surface,
                border: `1px solid ${ctrIssues.length ? `${C.danger}30` : C.border}`,
                borderRadius: 9,
                padding: "12px 18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <TrendingDown size={15} color={ctrIssues.length ? C.danger : C.textDim} />
              <span style={{ fontSize: 13, fontWeight: 700, color: ctrIssues.length ? C.danger : C.textMuted, fontFamily: font }}>
                {ctrIssues.length} CTR Issue{ctrIssues.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>· &lt;2% CTR</span>
            </div>
          </div>
        )}

        {/* ── Tab navigation ── */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 16px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                background: activeTab === id ? C.surface : "transparent",
                color: activeTab === id ? C.text : C.textMuted,
                fontSize: 13,
                fontWeight: activeTab === id ? 700 : 500,
                cursor: "pointer",
                fontFamily: font,
                borderBottom: activeTab === id ? `2px solid ${C.accent}` : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.15s",
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "24px",
        }}>

          {/* Overview */}
          {activeTab === "overview" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, fontFamily: font }}>
                Top Pages by Clicks
              </div>
              {statsLoading ? (
                <div style={{ color: C.textDim, fontSize: 13, fontFamily: font }}>Loading…</div>
              ) : (
                <PerfTable rows={topPages} emptyMsg="No data yet — sync to see your top pages." />
              )}
            </div>
          )}

          {/* Quick Wins */}
          {activeTab === "quick-wins" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: font }}>Quick Wins</div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font, marginTop: 4 }}>
                  Pages ranking positions 4–15 with 50+ impressions. One optimisation away from page 1.
                </div>
              </div>
              {insightsLoading ? (
                <div style={{ color: C.textDim, fontSize: 13, fontFamily: font }}>Loading…</div>
              ) : (
                <PerfTable rows={quickWins} emptyMsg="No quick wins found — pages need 50+ impressions and position 4–15." />
              )}
            </div>
          )}

          {/* CTR Issues */}
          {activeTab === "ctr-issues" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: font }}>CTR Issues</div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font, marginTop: 4 }}>
                  Pages with 100+ impressions but under 2% click-through rate. Fix the title or meta description.
                </div>
              </div>
              {insightsLoading ? (
                <div style={{ color: C.textDim, fontSize: 13, fontFamily: font }}>Loading…</div>
              ) : (
                <PerfTable rows={ctrIssues} emptyMsg="No CTR issues found — all pages above 2% CTR or insufficient impressions." />
              )}
            </div>
          )}

          {/* Indexing Log */}
          {activeTab === "log" && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16, fontFamily: font }}>
                Indexing Submissions
              </div>
              {logLoading ? (
                <div style={{ color: C.textDim, fontSize: 13, fontFamily: font }}>Loading…</div>
              ) : !log?.length ? (
                <div style={{ padding: "40px 0", textAlign: "center" as const, color: C.textDim, fontFamily: font, fontSize: 13 }}>
                  No submissions yet — URLs are submitted automatically when you publish content.
                </div>
              ) : (
                <div style={{ overflowX: "auto" as const }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" as const, fontFamily: font }}>
                    <thead>
                      <tr>
                        {["URL", "Type", "Status", "Submitted", "Code"].map((h) => (
                          <th key={h} style={{
                            textAlign: h === "URL" || h === "Type" || h === "Status" ? "left" : "right" as const,
                            padding: "8px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: C.textDim,
                            letterSpacing: "0.4px",
                            borderBottom: `1px solid ${C.border}`,
                            whiteSpace: "nowrap" as const,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {log.map((row, i) => {
                        const { label, color } = labelUrl(row.url);
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${C.border}20` }}>
                            <td style={{ padding: "10px 12px", maxWidth: 320 }}>
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: C.text, textDecoration: "none", fontSize: 12, fontFamily: font, display: "flex", alignItems: "center", gap: 5 }}
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 260 }}>
                                  {shortUrl(row.url)}
                                </span>
                                <ExternalLink size={10} color={C.textDim} style={{ flexShrink: 0 }} />
                              </a>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <TypePill label={label} color={color} />
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <StatusDot status={row.status} />
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 11, color: C.textMuted, fontFamily: font }}>
                              {row.submitted_at ? relTime(row.submitted_at) : row.created_at ? relTime(row.created_at) : "—"}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right" as const, fontSize: 11, color: row.http_code === 200 ? C.accent : C.danger, fontFamily: font }}>
                              {row.http_code || (row.status === "error" ? "ERR" : "—")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Submit URL */}
          {activeTab === "submit" && (
            <div style={{ maxWidth: 520 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: font }}>Manual URL Submit</div>
                <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font, marginTop: 4 }}>
                  Submit any URL to Google's Indexing API to request immediate crawling. Use the path only (e.g. /broker/ic-markets).
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="/broker/ic-markets or https://entrylab.io/broker/ic-markets"
                  value={submitPath}
                  onChange={(e) => { setSubmitPath(e.target.value); setSubmitResult(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && submitPath.trim() && !submitMutation.isPending) {
                      submitMutation.mutate(submitPath.trim());
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 7,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    color: C.text,
                    fontSize: 13,
                    fontFamily: font,
                    outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = C.accent; }}
                  onBlur={(e) => { e.target.style.borderColor = C.border; }}
                />
                <ActionBtn
                  label={submitMutation.isPending ? "Submitting…" : "Submit"}
                  primary
                  onClick={() => {
                    if (submitPath.trim()) submitMutation.mutate(submitPath.trim());
                  }}
                  disabled={!submitPath.trim() || submitMutation.isPending || !status?.enabled}
                />
              </div>
              {submitResult && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: `1px solid ${submitResult.ok ? C.accentBorder : `${C.danger}30`}`,
                  background: submitResult.ok ? `${C.accent}0d` : `${C.danger}0d`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontFamily: font,
                }}>
                  {submitResult.ok
                    ? <CheckCircle size={15} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                    : <AlertCircle size={15} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: submitResult.ok ? C.accent : C.danger }}>
                      {submitResult.ok ? "Submitted successfully" : "Submission failed"}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                      {submitResult.ok
                        ? `${submitResult.url} — Google will crawl it shortly.`
                        : submitResult.error}
                    </div>
                  </div>
                </div>
              )}
              <div style={{ marginTop: 24, padding: "14px 18px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, fontFamily: font, letterSpacing: "0.3px" }}>
                  COMMON URLS
                </div>
                {[
                  { label: "Homepage", path: "/" },
                  { label: "Brokers Hub", path: "/brokers" },
                  { label: "Prop Firms Hub", path: "/prop-firms" },
                  { label: "Compare Hub", path: "/compare" },
                  { label: "Signals", path: "/signals" },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => { setSubmitPath(path); setSubmitResult(null); }}
                    style={{
                      display: "block",
                      background: "none",
                      border: "none",
                      padding: "4px 0",
                      color: C.info,
                      fontSize: 12,
                      fontFamily: font,
                      cursor: "pointer",
                      textAlign: "left" as const,
                    }}
                  >
                    {path} <span style={{ color: C.textDim }}>· {label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
