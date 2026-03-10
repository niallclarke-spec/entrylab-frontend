import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font } from "@/lib/adminTheme";

function Sparkline({ data, color = C.accent, height = 32, width = 90 }: {
  data: number[]; color?: string; height?: number; width?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`
  ).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HorizontalBar({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: C.text }}>{label}</span>
        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: C.border }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: `${Math.min((value / maxValue) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

const SPARK_VISITORS =  [18,22,19,28,31,27,35,33,40,38,42,43];
const SPARK_SESSIONS =  [30,34,29,42,48,44,52,50,58,55,63,67];
const SPARK_PAGEVIEWS = [80,95,88,110,125,118,140,135,155,148,172,189];
const SPARK_DURATION =  [180,195,188,200,210,205,215,208,220,218,225,222];

const TOP_PAGES = [
  { page: "Prop Firms That Accept US Traders", views: 22140 },
  { page: "Best Prop Firms 2026", views: 14200 },
  { page: "FTMO vs FundedNext", views: 8740 },
  { page: "Best Brokers for Scalping", views: 6320 },
  { page: "How Prop Firm Challenges Work", views: 5310 },
  { page: "IC Markets Review", views: 4890 },
  { page: "Cheapest Prop Firms", views: 4210 },
];

const TOP_FIRMS = [
  { name: "FTMO", views: 18420, type: "prop" },
  { name: "IC Markets", views: 12340, type: "broker" },
  { name: "FundedNext", views: 9870, type: "prop" },
  { name: "Pepperstone", views: 8210, type: "broker" },
  { name: "BrightFunded", views: 5640, type: "prop" },
  { name: "DNA Funded", views: 4980, type: "prop" },
  { name: "Exness", views: 4350, type: "broker" },
];

const TOP_COUNTRIES = [
  { country: "United States", flag: "🇺🇸", sessions: 14820, pct: 22.1 },
  { country: "United Kingdom", flag: "🇬🇧", sessions: 8340, pct: 12.4 },
  { country: "India", flag: "🇮🇳", sessions: 5670, pct: 8.5 },
  { country: "Nigeria", flag: "🇳🇬", sessions: 4210, pct: 6.3 },
  { country: "Germany", flag: "🇩🇪", sessions: 3890, pct: 5.8 },
  { country: "Canada", flag: "🇨🇦", sessions: 3120, pct: 4.7 },
  { country: "Australia", flag: "🇦🇺", sessions: 2840, pct: 4.2 },
];

const SEARCH_QUERIES = [
  { query: "best prop firms", clicks: 2840, impressions: 41200, ctr: "6.9%", position: "3.2" },
  { query: "ftmo review", clicks: 1920, impressions: 28400, ctr: "6.8%", position: "4.1" },
  { query: "prop firms us traders", clicks: 1640, impressions: 19800, ctr: "8.3%", position: "2.8" },
  { query: "ic markets review", clicks: 1380, impressions: 22100, ctr: "6.2%", position: "5.4" },
  { query: "cheapest prop firms", clicks: 1120, impressions: 15600, ctr: "7.2%", position: "3.7" },
  { query: "ftmo vs fundednext", clicks: 980, impressions: 12400, ctr: "7.9%", position: "2.1" },
  { query: "best forex broker 2026", clicks: 870, impressions: 31200, ctr: "2.8%", position: "8.3" },
];

const card: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState("30d");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  if (!sessionLoading && !session) {
    navigate("/admin/login");
    return null;
  }

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>Dashboard</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>Site performance and traffic analytics</p>
          </div>
          <div style={{ display: "flex", gap: 3, background: C.surface, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
            {[{ key: "7d", label: "7D" }, { key: "30d", label: "30D" }, { key: "90d", label: "90D" }].map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                padding: "6px 14px", borderRadius: 6, border: "none",
                background: period === p.key ? C.accentDim : "transparent",
                color: period === p.key ? C.accent : C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 1 — KPI with sparklines */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
          {[
            { label: "UNIQUE VISITORS",      value: "42.8k", change: "+14.3%", spark: SPARK_VISITORS },
            { label: "SESSIONS",             value: "67.1k", change: "+11.7%", spark: SPARK_SESSIONS },
            { label: "PAGE VIEWS",           value: "189.4k", change: "+22.1%", spark: SPARK_PAGEVIEWS },
            { label: "AVG. SESSION DURATION", value: "3m 42s", change: "+8.4%", spark: SPARK_DURATION },
          ].map((stat, i) => (
            <div key={i} style={{ ...card, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.text, fontFamily: font }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: C.accent, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>↑ {stat.change}</span>
                    <span style={{ color: C.textDim }}>vs prev.</span>
                  </div>
                </div>
                <Sparkline data={stat.spark} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 — Secondary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "BOUNCE RATE",      value: "38.2%", change: "−2.1%" },
            { label: "PAGES / SESSION",  value: "2.82",  change: "+0.3" },
            { label: "AFFILIATE CLICKS", value: "3,847", change: "+26.4%" },
            { label: "AFFILIATE CTR",    value: "4.7%",  change: "+0.8%" },
          ].map((stat, i) => (
            <div key={i} style={{ ...card, padding: "18px 22px" }}>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.6px", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: font }}>{stat.value}</span>
                <span style={{ fontSize: 12, color: C.accent }}>↑ {stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Row 3 — 3-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Top Pages */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP PAGES</h3>
            {TOP_PAGES.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 11, color: C.textDim, width: 18, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.page}</span>
                </div>
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                  {(item.views / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>

          {/* Top Viewed Firms */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP VIEWED FIRMS</h3>
            {TOP_FIRMS.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.textDim, width: 18, fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: C.text }}>{item.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
                    background: item.type === "prop" ? "rgba(75,156,242,0.1)" : "rgba(242,162,8,0.1)",
                    color: item.type === "prop" ? C.info : C.warning,
                  }}>
                    {item.type === "prop" ? "PROP" : "BRK"}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, flexShrink: 0 }}>
                  {(item.views / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>

          {/* Top Countries */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP COUNTRIES</h3>
            {TOP_COUNTRIES.map((item, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{item.flag}</span>
                    <span style={{ fontSize: 12, color: C.text }}>{item.country}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{(item.sessions / 1000).toFixed(1)}k</span>
                    <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, width: 38, textAlign: "right" }}>{item.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: C.border }}>
                  <div style={{ height: "100%", borderRadius: 2, background: C.accent, width: `${(item.pct / 22.1) * 100}%`, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 4 — Traffic sources + Search queries */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Traffic Sources */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TRAFFIC SOURCES</h3>
            <HorizontalBar label="Organic Search" value={38420} maxValue={38420} color={C.accent} />
            <HorizontalBar label="Direct"         value={12830} maxValue={38420} color={C.info} />
            <HorizontalBar label="Social"         value={8640}  maxValue={38420} color="#A855F7" />
            <HorizontalBar label="Referral"       value={5210}  maxValue={38420} color={C.warning} />
            <HorizontalBar label="Paid"           value={2010}  maxValue={38420} color={C.danger} />
          </div>

          {/* Top Search Queries */}
          <div style={{ ...card, padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP SEARCH QUERIES</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Query", "Clicks", "Impr.", "CTR", "Pos."].map((h, i) => (
                    <th key={i} style={{ padding: "5px 6px", textAlign: i === 0 ? "left" : "right", fontSize: 10, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEARCH_QUERIES.map((row, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td style={{ padding: "7px 6px", fontSize: 12, color: C.text }}>{row.query}</td>
                    <td style={{ padding: "7px 6px", fontSize: 12, color: C.accent, fontWeight: 600, textAlign: "right" }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: "7px 6px", fontSize: 11, color: C.textMuted, textAlign: "right" }}>{(row.impressions / 1000).toFixed(1)}k</td>
                    <td style={{ padding: "7px 6px", fontSize: 11, color: C.textMuted, textAlign: "right" }}>{row.ctr}</td>
                    <td style={{ padding: "7px 6px", fontSize: 11, textAlign: "right", fontWeight: 600, color: parseFloat(row.position) <= 3 ? C.accent : parseFloat(row.position) <= 5 ? C.warning : C.textMuted }}>
                      {row.position}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
