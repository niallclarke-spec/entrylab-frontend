import { useState } from "react";

const COLORS = {
  bg: "#0B0E11",
  surface: "#12161C",
  surfaceHover: "#181D25",
  border: "#1E2530",
  borderLight: "#2A3140",
  text: "#E8ECF1",
  textMuted: "#7A8599",
  textDim: "#4A5568",
  accent: "#08F295",
  accentDim: "rgba(8, 242, 149, 0.1)",
  accentBorder: "rgba(8, 242, 149, 0.25)",
  warning: "#F2A208",
  danger: "#F24B4B",
  info: "#4B9CF2",
};

const sidebarSections = [
  {
    label: "CONTENT",
    items: [
      { id: "dashboard", icon: "◆", label: "Dashboard" },
      { id: "prop-firms", icon: "▲", label: "Prop Firms" },
      { id: "prop-firm-reviews", icon: "★", label: "Prop Firm Reviews" },
      { id: "brokers", icon: "◇", label: "Brokers" },
      { id: "broker-reviews", icon: "★", label: "Broker Reviews" },
    ],
  },
  {
    label: "EDITORIAL",
    items: [
      { id: "comparisons", icon: "⇔", label: "Comparisons" },
      { id: "pages", icon: "▦", label: "Pages & Guides" },
      { id: "posts", icon: "✎", label: "Blog Posts" },
    ],
  },
  {
    label: "TAXONOMY",
    items: [
      { id: "tags", icon: "⊞", label: "Tags & Categories" },
      { id: "countries", icon: "⊕", label: "Countries" },
      { id: "platforms", icon: "⊟", label: "Platforms" },
      { id: "regulators", icon: "⊡", label: "Regulators" },
      { id: "payments", icon: "◈", label: "Payment Methods" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { id: "affiliates", icon: "◉", label: "Affiliate Links" },
      { id: "seo", icon: "⊙", label: "SEO Settings" },
      { id: "users", icon: "◎", label: "Team / Users" },
    ],
  },
];

const mockFirms = [
  { id: 1, name: "FTMO", type: "prop_firm", rating: 8.7, status: "published", trustpilot: 4.8, reviews: 342, challenges: 6, updated: "2d ago" },
  { id: 2, name: "FundedNext", type: "prop_firm", rating: 8.4, status: "published", trustpilot: 4.6, reviews: 218, challenges: 8, updated: "1d ago" },
  { id: 3, name: "IC Markets", type: "broker", rating: 9.1, status: "published", trustpilot: 4.9, reviews: 567, challenges: 0, updated: "5h ago" },
  { id: 4, name: "DNA Funded", type: "prop_firm", rating: 7.9, status: "draft", trustpilot: 4.3, reviews: 89, challenges: 4, updated: "3d ago" },
  { id: 5, name: "Pepperstone", type: "broker", rating: 8.8, status: "published", trustpilot: 4.7, reviews: 412, challenges: 0, updated: "12h ago" },
  { id: 6, name: "BrightFunded", type: "prop_firm", rating: 8.1, status: "draft", trustpilot: 4.5, reviews: 156, challenges: 5, updated: "6h ago" },
];

const mockPages = [
  { id: 1, title: "Best Prop Firms 2026", type: "list", status: "published", firms: 12, views: "14.2k", updated: "1d ago" },
  { id: 2, title: "FTMO vs FundedNext", type: "comparison", status: "published", firms: 2, views: "8.7k", updated: "3d ago" },
  { id: 3, title: "Best Brokers for Scalping", type: "guide", status: "draft", firms: 8, views: "—", updated: "5h ago" },
  { id: 4, title: "Prop Firms That Accept US Traders", type: "list", status: "published", firms: 15, views: "22.1k", updated: "2d ago" },
  { id: 5, title: "How Prop Firm Challenges Work", type: "tutorial", status: "published", firms: 0, views: "5.3k", updated: "1w ago" },
];

const mockReviews = [
  { id: 1, firm: "FTMO", author: "traderjoe92", rating: 4.5, status: "pending", date: "2h ago", excerpt: "Passed the challenge in 12 days, payout received within..." },
  { id: 2, firm: "IC Markets", author: "fxscalper", rating: 5.0, status: "approved", date: "5h ago", excerpt: "Best spreads I've seen on EUR/USD, execution is..." },
  { id: 3, firm: "FundedNext", author: "swingking", rating: 3.0, status: "pending", date: "8h ago", excerpt: "Failed due to trailing drawdown, felt the rules were..." },
  { id: 4, firm: "DNA Funded", author: "cryptodan", rating: 2.0, status: "flagged", date: "1d ago", excerpt: "Been waiting 3 weeks for my payout, support isn't..." },
  { id: 5, firm: "Pepperstone", author: "londontrader", rating: 4.0, status: "approved", date: "1d ago", excerpt: "Solid all-round broker, cTrader integration is..." },
];

const StatCard = ({ label, value, change, changeType }) => (
  <div style={{
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: "20px 22px",
    flex: 1,
    minWidth: 180,
  }}>
    <div style={{ fontSize: 12, color: COLORS.textMuted, letterSpacing: "0.5px", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
    {change && (
      <div style={{
        fontSize: 12,
        color: changeType === "up" ? COLORS.accent : changeType === "down" ? COLORS.danger : COLORS.textMuted,
        marginTop: 6,
      }}>
        {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    published: { bg: "rgba(8,242,149,0.1)", color: COLORS.accent, border: "rgba(8,242,149,0.2)" },
    draft: { bg: "rgba(122,133,153,0.1)", color: COLORS.textMuted, border: "rgba(122,133,153,0.2)" },
    pending: { bg: "rgba(242,162,8,0.12)", color: COLORS.warning, border: "rgba(242,162,8,0.25)" },
    approved: { bg: "rgba(8,242,149,0.1)", color: COLORS.accent, border: "rgba(8,242,149,0.2)" },
    flagged: { bg: "rgba(242,75,75,0.12)", color: COLORS.danger, border: "rgba(242,75,75,0.25)" },
  };
  const s = styles[status] || styles.draft;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.3px",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const isProp = type === "prop_firm";
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: isProp ? "rgba(75,156,242,0.1)" : "rgba(242,162,8,0.1)",
      color: isProp ? COLORS.info : COLORS.warning,
      border: `1px solid ${isProp ? "rgba(75,156,242,0.2)" : "rgba(242,162,8,0.2)"}`,
    }}>
      {isProp ? "Prop Firm" : "Broker"}
    </span>
  );
};

const ActionBtn = ({ label, primary, danger, small, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: small ? "5px 12px" : "8px 18px",
      borderRadius: 7,
      border: primary ? "none" : `1px solid ${danger ? COLORS.danger : COLORS.borderLight}`,
      background: primary ? COLORS.accent : "transparent",
      color: primary ? COLORS.bg : danger ? COLORS.danger : COLORS.textMuted,
      fontSize: small ? 12 : 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: "inherit",
    }}
  >
    {label}
  </button>
);

// ─── MINI SPARKLINE ──────────────────────────────────────────
const Sparkline = ({ data, color, height = 32, width = 90 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── BAR CHART ───────────────────────────────────────────────
const HorizontalBar = ({ label, value, maxValue, color, suffix = "" }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, color: COLORS.text }}>{label}</span>
      <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 600 }}>{value.toLocaleString()}{suffix}</span>
    </div>
    <div style={{ height: 6, borderRadius: 3, background: COLORS.border }}>
      <div style={{
        height: "100%", borderRadius: 3, background: color,
        width: `${Math.min((value / maxValue) * 100, 100)}%`,
        transition: "width 0.6s ease",
      }} />
    </div>
  </div>
);

// ─── DASHBOARD VIEW ──────────────────────────────────────────
const DashboardView = ({ setActiveView }) => {
  const [period, setPeriod] = useState("30d");
  return (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Dashboard</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>Site performance and traffic analytics</p>
      </div>
      <div style={{ display: "flex", gap: 4, background: COLORS.surface, borderRadius: 8, padding: 3, border: `1px solid ${COLORS.border}` }}>
        {[
          { key: "7d", label: "7D" },
          { key: "30d", label: "30D" },
          { key: "90d", label: "90D" },
        ].map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)} style={{
            padding: "6px 14px", borderRadius: 6, border: "none",
            background: period === p.key ? COLORS.accentDim : "transparent",
            color: period === p.key ? COLORS.accent : COLORS.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            {p.label}
          </button>
        ))}
      </div>
    </div>

    {/* ─── TOP METRICS ROW ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { label: "UNIQUE VISITORS", value: "42.8k", change: "+14.3%", type: "up", spark: [18,22,19,28,31,27,35,33,40,38,42,43] },
        { label: "SESSIONS", value: "67.1k", change: "+11.7%", type: "up", spark: [30,34,29,42,48,44,52,50,58,55,63,67] },
        { label: "PAGE VIEWS", value: "189.4k", change: "+22.1%", type: "up", spark: [80,95,88,110,125,118,140,135,155,148,172,189] },
        { label: "AVG. SESSION DURATION", value: "3m 42s", change: "+8.4%", type: "up", spark: [180,195,188,200,210,205,215,208,220,218,225,222] },
      ].map((stat, i) => (
        <div key={i} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "20px 22px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.6px", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: stat.type === "up" ? COLORS.accent : COLORS.danger, marginTop: 4 }}>
                {stat.type === "up" ? "↑" : "↓"} {stat.change} <span style={{ color: COLORS.textDim }}>vs prev.</span>
              </div>
            </div>
            <Sparkline data={stat.spark} color={stat.type === "up" ? COLORS.accent : COLORS.danger} />
          </div>
        </div>
      ))}
    </div>

    {/* ─── SECOND ROW: bounce, conversion etc ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { label: "BOUNCE RATE", value: "38.2%", change: "−2.1%", type: "up" },
        { label: "PAGES / SESSION", value: "2.82", change: "+0.3", type: "up" },
        { label: "AFFILIATE CLICKS", value: "3,847", change: "+26.4%", type: "up" },
        { label: "AFFILIATE CTR", value: "4.7%", change: "+0.8%", type: "up" },
      ].map((stat, i) => (
        <div key={i} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "18px 22px",
        }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: "0.6px", marginBottom: 6 }}>{stat.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{stat.value}</span>
            <span style={{ fontSize: 12, color: stat.type === "up" ? COLORS.accent : COLORS.danger }}>
              {stat.type === "up" ? "↑" : "↓"} {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* ─── MAIN GRID: 3 columns ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

      {/* TOP PAGES */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP PAGES</h3>
        {[
          { page: "Prop Firms That Accept US Traders", views: 22140 },
          { page: "Best Prop Firms 2026", views: 14200 },
          { page: "FTMO vs FundedNext", views: 8740 },
          { page: "Best Brokers for Scalping", views: 6320 },
          { page: "How Prop Firm Challenges Work", views: 5310 },
          { page: "IC Markets Review", views: 4890 },
          { page: "Cheapest Prop Firms", views: 4210 },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: COLORS.textDim, width: 18, fontWeight: 600 }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.3 }}>{item.page}</span>
            </div>
            <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{(item.views / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </div>

      {/* TOP BROKERS/FIRMS */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP VIEWED FIRMS</h3>
        {[
          { name: "FTMO", views: 18420, type: "prop" },
          { name: "IC Markets", views: 12340, type: "broker" },
          { name: "FundedNext", views: 9870, type: "prop" },
          { name: "Pepperstone", views: 8210, type: "broker" },
          { name: "BrightFunded", views: 5640, type: "prop" },
          { name: "DNA Funded", views: 4980, type: "prop" },
          { name: "Exness", views: 4350, type: "broker" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: COLORS.textDim, width: 18, fontWeight: 600 }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: COLORS.text }}>{item.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
                background: item.type === "prop" ? "rgba(75,156,242,0.1)" : "rgba(242,162,8,0.1)",
                color: item.type === "prop" ? COLORS.info : COLORS.warning,
              }}>{item.type === "prop" ? "PROP" : "BRK"}</span>
            </div>
            <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, flexShrink: 0 }}>{(item.views / 1000).toFixed(1)}k</span>
          </div>
        ))}
      </div>

      {/* TOP GEOS */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP COUNTRIES</h3>
        {[
          { country: "United States", flag: "🇺🇸", sessions: 14820, pct: 22.1 },
          { country: "United Kingdom", flag: "🇬🇧", sessions: 8340, pct: 12.4 },
          { country: "India", flag: "🇮🇳", sessions: 5670, pct: 8.5 },
          { country: "Nigeria", flag: "🇳🇬", sessions: 4210, pct: 6.3 },
          { country: "Germany", flag: "🇩🇪", sessions: 3890, pct: 5.8 },
          { country: "Canada", flag: "🇨🇦", sessions: 3120, pct: 4.7 },
          { country: "Australia", flag: "🇦🇺", sessions: 2840, pct: 4.2 },
        ].map((item, i) => (
          <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{item.flag}</span>
                <span style={{ fontSize: 12, color: COLORS.text }}>{item.country}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>{(item.sessions / 1000).toFixed(1)}k</span>
                <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, width: 40, textAlign: "right" }}>{item.pct}%</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: COLORS.border }}>
              <div style={{ height: "100%", borderRadius: 2, background: COLORS.accent, width: `${(item.pct / 22.1) * 100}%`, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* ─── BOTTOM ROW ─── */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

      {/* TRAFFIC SOURCES */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TRAFFIC SOURCES</h3>
        <HorizontalBar label="Organic Search" value={38420} maxValue={38420} color={COLORS.accent} />
        <HorizontalBar label="Direct" value={12830} maxValue={38420} color={COLORS.info} />
        <HorizontalBar label="Social" value={8640} maxValue={38420} color="#A855F7" />
        <HorizontalBar label="Referral" value={5210} maxValue={38420} color={COLORS.warning} />
        <HorizontalBar label="Paid" value={2010} maxValue={38420} color={COLORS.danger} />
      </div>

      {/* TOP SEARCH QUERIES */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, margin: "0 0 16px", letterSpacing: "0.8px" }}>TOP SEARCH QUERIES</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Query", "Clicks", "Impr.", "CTR", "Pos."].map((h, i) => (
                <th key={i} style={{ padding: "6px 8px", textAlign: i === 0 ? "left" : "right", fontSize: 10, fontWeight: 600, color: COLORS.textDim, letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { query: "best prop firms", clicks: 2840, impressions: 41200, ctr: "6.9%", position: "3.2" },
              { query: "ftmo review", clicks: 1920, impressions: 28400, ctr: "6.8%", position: "4.1" },
              { query: "prop firms us traders", clicks: 1640, impressions: 19800, ctr: "8.3%", position: "2.8" },
              { query: "ic markets review", clicks: 1380, impressions: 22100, ctr: "6.2%", position: "5.4" },
              { query: "cheapest prop firms", clicks: 1120, impressions: 15600, ctr: "7.2%", position: "3.7" },
              { query: "ftmo vs fundednext", clicks: 980, impressions: 12400, ctr: "7.9%", position: "2.1" },
              { query: "best forex broker 2026", clicks: 870, impressions: 31200, ctr: "2.8%", position: "8.3" },
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "8px 8px", fontSize: 12, color: COLORS.text }}>{row.query}</td>
                <td style={{ padding: "8px 8px", fontSize: 12, color: COLORS.accent, fontWeight: 600, textAlign: "right" }}>{row.clicks.toLocaleString()}</td>
                <td style={{ padding: "8px 8px", fontSize: 11, color: COLORS.textMuted, textAlign: "right" }}>{(row.impressions / 1000).toFixed(1)}k</td>
                <td style={{ padding: "8px 8px", fontSize: 11, color: COLORS.textMuted, textAlign: "right" }}>{row.ctr}</td>
                <td style={{ padding: "8px 8px", fontSize: 11, color: parseFloat(row.position) <= 3 ? COLORS.accent : parseFloat(row.position) <= 5 ? COLORS.warning : COLORS.textMuted, fontWeight: 600, textAlign: "right" }}>{row.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

// ─── FIRMS LIST VIEW ─────────────────────────────────────────
const FirmsListView = ({ setActiveView, filterType }) => {
  const filtered = filterType ? mockFirms.filter(f => f.type === filterType) : mockFirms;
  const isProp = filterType === "prop_firm";
  const title = isProp ? "Prop Firms" : "Brokers";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>{filtered.length} {title.toLowerCase()}</p>
        </div>
        <ActionBtn label={`+ Add ${isProp ? "Prop Firm" : "Broker"}`} primary onClick={() => setActiveView("firm-editor")} />
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Firm", "Type", "Rating", "Trustpilot", "Reviews", "Status", "Updated", ""].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textDim, letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(firm => (
              <tr key={firm.id} style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{firm.name}</span>
                </td>
                <td style={{ padding: "14px 16px" }}><TypeBadge type={firm.type} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14 }}>{firm.rating}</span>
                  <span style={{ color: COLORS.textDim, fontSize: 12 }}>/10</span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ color: COLORS.text, fontSize: 13 }}>⭐ {firm.trustpilot}</span>
                  <span style={{ color: COLORS.textDim, fontSize: 11, marginLeft: 4 }}>({firm.reviews})</span>
                </td>
                <td style={{ padding: "14px 16px", color: COLORS.textMuted, fontSize: 13 }}>{firm.reviews}</td>
                <td style={{ padding: "14px 16px" }}><StatusBadge status={firm.status} /></td>
                <td style={{ padding: "14px 16px", color: COLORS.textDim, fontSize: 12 }}>{firm.updated}</td>
                <td style={{ padding: "14px 16px" }}>
                  <ActionBtn label="Edit" small onClick={() => setActiveView("firm-editor")} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── FIRM EDITOR VIEW ────────────────────────────────────────
const FirmEditorView = ({ setActiveView }) => {
  const [activeTab, setActiveTab] = useState("general");
  const tabs = [
    { id: "general", label: "General Info" },
    { id: "challenges", label: "Challenge Plans" },
    { id: "accounts", label: "Broker Accounts" },
    { id: "regulation", label: "Regulation" },
    { id: "platforms", label: "Platforms" },
    { id: "instruments", label: "Instruments" },
    { id: "rules", label: "Trading Rules" },
    { id: "payments", label: "Payments" },
    { id: "countries", label: "Countries" },
    { id: "affiliate", label: "Affiliate" },
    { id: "editorial", label: "Editorial" },
    { id: "seo", label: "SEO" },
  ];

  const FormGroup = ({ label, hint, children, span }) => (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, letterSpacing: "0.3px" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const Input = ({ placeholder, type = "text", value = "" }) => (
    <input type={type} placeholder={placeholder} defaultValue={value} style={{
      width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
      background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
    }}
      onFocus={e => e.target.style.borderColor = COLORS.accent}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  );

  const Select = ({ options, placeholder }) => (
    <select style={{
      width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
      background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box", appearance: "none",
    }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  const Toggle = ({ label, defaultChecked }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 38, height: 20, borderRadius: 10, background: defaultChecked ? COLORS.accent : COLORS.border,
        position: "relative", cursor: "pointer", transition: "all 0.2s",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2, left: defaultChecked ? 20 : 2, transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
    </div>
  );

  const TextArea = ({ placeholder, rows = 4 }) => (
    <textarea placeholder={placeholder} rows={rows} style={{
      width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
      background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box", resize: "vertical",
    }}
      onFocus={e => e.target.style.borderColor = COLORS.accent}
      onBlur={e => e.target.style.borderColor = COLORS.border}
    />
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setActiveView("prop-firms")} style={{
            background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6,
            color: COLORS.textMuted, padding: "6px 10px", cursor: "pointer", fontSize: 14,
          }}>←</button>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>New Firm</h2>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>Fill in details across each tab</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <ActionBtn label="Save Draft" />
          <ActionBtn label="Publish" primary />
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 24, overflowX: "auto",
        borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0,
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 16px", background: "none", border: "none",
            borderBottom: `2px solid ${activeTab === tab.id ? COLORS.accent : "transparent"}`,
            color: activeTab === tab.id ? COLORS.accent : COLORS.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap", letterSpacing: "0.2px", transition: "all 0.15s",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 28 }}>
        {activeTab === "general" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <FormGroup label="FIRM NAME"><Input placeholder="e.g. FTMO" /></FormGroup>
            <FormGroup label="TYPE">
              <Select options={["Prop Firm", "Broker", "Both"]} placeholder="Select type..." />
            </FormGroup>
            <FormGroup label="SLUG" hint="Auto-generated from name, editable"><Input placeholder="e.g. ftmo" /></FormGroup>
            <FormGroup label="WEBSITE URL"><Input placeholder="https://" /></FormGroup>
            <FormGroup label="FOUNDED YEAR"><Input placeholder="2018" type="number" /></FormGroup>
            <FormGroup label="HEADQUARTERS">
              <div style={{ display: "flex", gap: 10 }}>
                <Input placeholder="City" />
                <Input placeholder="Country" />
              </div>
            </FormGroup>
            <FormGroup label="PARENT COMPANY"><Input placeholder="Optional" /></FormGroup>
            <FormGroup label="CEO / FOUNDER"><Input placeholder="Optional" /></FormGroup>
            <FormGroup label="SHORT DESCRIPTION" span={2} hint="Used in cards and list pages">
              <TextArea placeholder="One-liner about this firm..." rows={2} />
            </FormGroup>
            <FormGroup label="LOGO" span={1}>
              <div style={{
                border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 24,
                textAlign: "center", color: COLORS.textMuted, fontSize: 13, cursor: "pointer",
              }}>
                Drop logo or click to upload
              </div>
            </FormGroup>
            <FormGroup label="RATINGS & TRUST" span={1}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4, display: "block" }}>Your Rating (0–10)</label>
                    <Input placeholder="8.5" type="number" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4, display: "block" }}>Trustpilot Rating</label>
                    <Input placeholder="4.7" type="number" />
                  </div>
                </div>
                <Toggle label="Verified by us" defaultChecked={false} />
                <Toggle label="Publicly traded" defaultChecked={false} />
                <Toggle label="Featured on homepage" defaultChecked={false} />
              </div>
            </FormGroup>
            <FormGroup label="DISCOUNT / PROMO" span={2}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Input placeholder="Promo code" />
                <Input placeholder="Discount %" type="number" />
                <Input placeholder="Expiry date" type="date" />
              </div>
            </FormGroup>
          </div>
        )}

        {activeTab === "challenges" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>Define evaluation challenge plans for this prop firm</p>
              <ActionBtn label="+ Add Plan" primary />
            </div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <FormGroup label="PLAN NAME"><Input placeholder="Standard 100K" /></FormGroup>
                <FormGroup label="CHALLENGE TYPE">
                  <Select options={["1-Step", "2-Step", "3-Step", "Instant Funding"]} placeholder="Select..." />
                </FormGroup>
                <FormGroup label="ACCOUNT SIZE"><Input placeholder="100000" type="number" /></FormGroup>
                <FormGroup label="EVALUATION FEE"><Input placeholder="499" type="number" /></FormGroup>
                <FormGroup label="ACTIVATION FEE"><Input placeholder="0" type="number" /></FormGroup>
                <FormGroup label="RESET FEE"><Input placeholder="199" type="number" /></FormGroup>
                <FormGroup label="PROFIT TARGET PH.1 (%)"><Input placeholder="8" type="number" /></FormGroup>
                <FormGroup label="PROFIT TARGET PH.2 (%)"><Input placeholder="5" type="number" /></FormGroup>
                <FormGroup label="DAILY DRAWDOWN (%)"><Input placeholder="5" type="number" /></FormGroup>
                <FormGroup label="MAX DRAWDOWN (%)"><Input placeholder="10" type="number" /></FormGroup>
                <FormGroup label="DRAWDOWN TYPE">
                  <Select options={["Static", "Trailing (EOD)", "Trailing (Realtime)", "Equity-Based", "Balance-Based"]} placeholder="Select..." />
                </FormGroup>
                <FormGroup label="PROFIT SPLIT">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Input placeholder="80" type="number" /><span style={{ color: COLORS.textDim }}>to</span><Input placeholder="90" type="number" /><span style={{ color: COLORS.textDim }}>%</span>
                  </div>
                </FormGroup>
                <FormGroup label="MIN TRADING DAYS"><Input placeholder="5" type="number" /></FormGroup>
                <FormGroup label="MAX TRADING DAYS"><Input placeholder="Unlimited" /></FormGroup>
                <FormGroup label="PAYOUT FREQUENCY">
                  <Select options={["On Demand", "Bi-Weekly", "Monthly", "Weekly"]} placeholder="Select..." />
                </FormGroup>
                <FormGroup label="FIRST PAYOUT (DAYS)"><Input placeholder="14" type="number" /></FormGroup>
                <FormGroup label="MAX FUNDED BALANCE"><Input placeholder="400000" type="number" /></FormGroup>
                <FormGroup label="MAX POSITION SIZE"><Input placeholder="100 lots" /></FormGroup>
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
                <Toggle label="Consistency rule" defaultChecked={false} />
                <Toggle label="Fee refundable on pass" defaultChecked={true} />
                <Toggle label="Free retry on fail" defaultChecked={false} />
              </div>
              <FormGroup label="SCALING PLAN DETAILS">
                <TextArea placeholder="Describe scaling milestones, e.g. 'After 4 months of consistent profit, account scales to...' " rows={3} />
              </FormGroup>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 20px" }}>Toggle which strategies and behaviours are permitted</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: "News Trading", default: true },
                { label: "Weekend Holding", default: false },
                { label: "Expert Advisors (EAs)", default: true },
                { label: "Copy Trading", default: false },
                { label: "Scalping", default: true },
                { label: "Hedging", default: true },
                { label: "Martingale", default: false },
                { label: "Overnight Positions", default: true },
                { label: "Grid Trading", default: false },
                { label: "High-Frequency Trading", default: false },
              ].map((rule, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`,
                }}>
                  <Toggle label={rule.label} defaultChecked={rule.default} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "editorial" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            <FormGroup label="FULL REVIEW (MARKDOWN)">
              <TextArea placeholder="Write your in-depth editorial review here. Supports markdown..." rows={12} />
            </FormGroup>
            <FormGroup label="PROS">
              {["Low evaluation fees for the account size", "Fast payout processing (1-2 days)", ""].map((pro, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: COLORS.accent, fontWeight: 700, lineHeight: "36px" }}>+</span>
                  <Input placeholder="Add a pro..." value={pro} />
                </div>
              ))}
              <button style={{ background: "none", border: "none", color: COLORS.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>+ Add another pro</button>
            </FormGroup>
            <FormGroup label="CONS">
              {["Trailing drawdown can be confusing for beginners", ""].map((con, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: COLORS.danger, fontWeight: 700, lineHeight: "36px" }}>−</span>
                  <Input placeholder="Add a con..." value={con} />
                </div>
              ))}
              <button style={{ background: "none", border: "none", color: COLORS.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}>+ Add another con</button>
            </FormGroup>
          </div>
        )}

        {activeTab === "regulation" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>Add regulatory licences held by this firm</p>
              <ActionBtn label="+ Add Licence" primary />
            </div>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <FormGroup label="REGULATOR">
                  <Select options={["FCA (UK)", "CySEC (Cyprus)", "ASIC (Australia)", "BaFin (Germany)", "FSCA (South Africa)", "FSC (Belize)", "VFSC (Vanuatu)", "Other..."]} placeholder="Select regulator..." />
                </FormGroup>
                <FormGroup label="REGULATORY TIER">
                  <Select options={["Tier 1 — Highly Trusted", "Tier 2 — Trusted", "Tier 3 — Average Risk", "Tier 4 — High Risk", "Offshore", "Unregulated"]} placeholder="Select tier..." />
                </FormGroup>
                <FormGroup label="LICENCE NUMBER"><Input placeholder="e.g. FRN 195355" /></FormGroup>
                <FormGroup label="ENTITY NAME"><Input placeholder="Legal entity name" /></FormGroup>
                <FormGroup label="COUNTRY"><Input placeholder="United Kingdom" /></FormGroup>
                <FormGroup label="">
                  <div style={{ paddingTop: 20 }}><Toggle label="Primary regulation" defaultChecked={true} /></div>
                </FormGroup>
              </div>
            </div>
          </div>
        )}

        {!["general", "challenges", "rules", "editorial", "regulation"].includes(activeTab) && (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>Tab: <strong style={{ color: COLORS.accent }}>{tabs.find(t => t.id === activeTab)?.label}</strong></div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Form fields for this section follow the same pattern — select from reference data, toggle options, and input values.</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── REVIEWS VIEW ────────────────────────────────────────────
const ReviewsView = ({ type }) => {
  const [filter, setFilter] = useState("all");
  const isProp = type === "prop-firm-reviews";
  const relevantReviews = isProp
    ? mockReviews.filter(r => ["FTMO", "FundedNext", "DNA Funded"].includes(r.firm))
    : mockReviews.filter(r => ["IC Markets", "Pepperstone"].includes(r.firm));
  const filtered = filter === "all" ? relevantReviews : relevantReviews.filter(r => r.status === filter);
  const title = isProp ? "Prop Firm Reviews" : "Broker Reviews";
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>{relevantReviews.filter(r => r.status === "pending").length} pending review{relevantReviews.filter(r => r.status === "pending").length !== 1 ? "s" : ""}</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "pending", "approved", "flagged"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 16px", borderRadius: 20, border: `1px solid ${filter === f ? COLORS.accentBorder : COLORS.border}`,
            background: filter === f ? COLORS.accentDim : "transparent",
            color: filter === f ? COLORS.accent : COLORS.textMuted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
          }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(review => (
          <div key={review.id} style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <span style={{ fontWeight: 600, color: COLORS.text, fontSize: 14 }}>{review.firm}</span>
                <span style={{ color: COLORS.textDim, fontSize: 12, marginLeft: 8 }}>by {review.author}</span>
                <span style={{ color: COLORS.textDim, fontSize: 12, marginLeft: 8 }}>• {review.date}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: COLORS.warning, fontWeight: 700 }}>{"⭐".repeat(Math.floor(review.rating))}</span>
                <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 14 }}>{review.rating}</span>
                <StatusBadge status={review.status} />
              </div>
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.5 }}>{review.excerpt}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <ActionBtn label="✓ Approve" small />
              <ActionBtn label="✕ Reject" small danger />
              <ActionBtn label="View Full" small />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PAGES VIEW ──────────────────────────────────────────────
const PagesView = ({ setActiveView }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Pages & Guides</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>SEO content pages, ranked lists, and comparison articles</p>
      </div>
      <ActionBtn label="+ New Page" primary onClick={() => setActiveView("page-editor")} />
    </div>

    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
            {["Title", "Type", "Firms", "Views", "Status", "Updated", ""].map((h, i) => (
              <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: COLORS.textDim, letterSpacing: "0.5px" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mockPages.map(page => (
            <tr key={page.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "14px 16px", fontWeight: 600, color: COLORS.text, fontSize: 13 }}>{page.title}</td>
              <td style={{ padding: "14px 16px" }}>
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "rgba(75,156,242,0.1)", color: COLORS.info, border: "1px solid rgba(75,156,242,0.2)",
                  textTransform: "capitalize",
                }}>{page.type}</span>
              </td>
              <td style={{ padding: "14px 16px", color: COLORS.textMuted, fontSize: 13 }}>{page.firms}</td>
              <td style={{ padding: "14px 16px", color: COLORS.textMuted, fontSize: 13 }}>{page.views}</td>
              <td style={{ padding: "14px 16px" }}><StatusBadge status={page.status} /></td>
              <td style={{ padding: "14px 16px", color: COLORS.textDim, fontSize: 12 }}>{page.updated}</td>
              <td style={{ padding: "14px 16px" }}><ActionBtn label="Edit" small /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── PAGE EDITOR VIEW ────────────────────────────────────────
const PageEditorView = ({ setActiveView }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setActiveView("pages")} style={{
          background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6,
          color: COLORS.textMuted, padding: "6px 10px", cursor: "pointer", fontSize: 14,
        }}>←</button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>New Page</h2>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "4px 0 0" }}>Create a ranked list, guide, or comparison page</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <ActionBtn label="Save Draft" />
        <ActionBtn label="Publish" primary />
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>PAGE TITLE</label>
            <input placeholder="e.g. Best Prop Firms for Beginners 2026" style={{
              width: "100%", padding: "12px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
              background: COLORS.bg, color: COLORS.text, fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>SLUG</label>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span style={{ padding: "10px 12px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRight: "none", borderRadius: "7px 0 0 7px", color: COLORS.textDim, fontSize: 13 }}>yoursite.com/</span>
              <input placeholder="best-prop-firms-beginners-2026" style={{
                flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.border}`, borderRadius: "0 7px 7px 0",
                background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, display: "block" }}>BODY CONTENT (MARKDOWN)</label>
            <textarea rows={14} placeholder="Write your page content here..." style={{
              width: "100%", padding: "14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
              background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "monospace",
              outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6,
            }} />
          </div>
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>FEATURED FIRMS</label>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>Drag to reorder ranking</span>
          </div>
          {[
            { pos: 1, name: "FTMO", rating: 8.7 },
            { pos: 2, name: "FundedNext", rating: 8.4 },
            { pos: 3, name: "BrightFunded", rating: 8.1 },
          ].map((firm, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8,
              marginBottom: 8, cursor: "grab",
            }}>
              <span style={{ color: COLORS.textDim, fontSize: 14, width: 20 }}>≡</span>
              <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14, width: 24 }}>#{firm.pos}</span>
              <span style={{ flex: 1, color: COLORS.text, fontSize: 13, fontWeight: 600 }}>{firm.name}</span>
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{firm.rating}/10</span>
              <button style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 14 }}>×</button>
            </div>
          ))}
          <button style={{
            width: "100%", padding: 10, background: "none", border: `1px dashed ${COLORS.border}`,
            borderRadius: 8, color: COLORS.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            + Add firm to this page
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>PAGE TYPE</label>
          <select style={{
            width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
            background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit", marginBottom: 16,
          }}>
            <option>Ranked List</option>
            <option>Guide</option>
            <option>Comparison</option>
            <option>News</option>
            <option>Tutorial</option>
          </select>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>STATUS</label>
          <select style={{
            width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${COLORS.border}`,
            background: COLORS.bg, color: COLORS.text, fontSize: 13, fontFamily: "inherit",
          }}>
            <option>Draft</option>
            <option>Published</option>
            <option>Scheduled</option>
          </select>
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: "block", letterSpacing: "0.3px" }}>SEO</label>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4, display: "block" }}>Meta Title</label>
            <input placeholder="Best Prop Firms for Beginners 2026 | YourSite" style={{
              width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
              background: COLORS.bg, color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4, display: "block" }}>Meta Description</label>
            <textarea rows={3} placeholder="Compare the best prop firms for beginners in 2026..." style={{
              width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
              background: COLORS.bg, color: COLORS.text, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical",
            }} />
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>0/160 characters</div>
          </div>
        </div>

        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: "block" }}>FEATURED IMAGE</label>
          <div style={{
            border: `2px dashed ${COLORS.border}`, borderRadius: 8, padding: 28,
            textAlign: "center", color: COLORS.textMuted, fontSize: 12, cursor: "pointer",
          }}>
            Drop image or click
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── PLACEHOLDER VIEW ────────────────────────────────────────
const PlaceholderView = ({ title, description }) => (
  <div style={{ textAlign: "center", padding: 60, color: COLORS.textDim }}>
    <div style={{ fontSize: 40, marginBottom: 16 }}>◎</div>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>{title}</h2>
    <p style={{ fontSize: 13, color: COLORS.textMuted, maxWidth: 400, margin: "0 auto" }}>{description}</p>
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────
export default function AdminPanel() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <DashboardView setActiveView={setActiveView} />;
      case "prop-firms": return <FirmsListView setActiveView={setActiveView} filterType="prop_firm" />;
      case "brokers": return <FirmsListView setActiveView={setActiveView} filterType="broker" />;
      case "firm-editor": return <FirmEditorView setActiveView={setActiveView} />;
      case "prop-firm-reviews": case "broker-reviews": return <ReviewsView type={activeView} />;
      case "pages": case "posts": return <PagesView setActiveView={setActiveView} />;
      case "page-editor": return <PageEditorView setActiveView={setActiveView} />;
      case "comparisons": return <PlaceholderView title="Comparisons" description="Build head-to-head comparison pages (e.g. FTMO vs FundedNext) with editorial content." />;
      case "tags": return <PlaceholderView title="Tags & Categories" description="Manage firm tags like 'beginner-friendly', 'instant-funding', 'us-traders' etc." />;
      case "countries": return <PlaceholderView title="Countries" description="Manage accepted/restricted country lists for each firm." />;
      case "platforms": return <PlaceholderView title="Platforms" description="Reference data for MT4, MT5, cTrader, TradingView, proprietary platforms." />;
      case "regulators": return <PlaceholderView title="Regulators" description="Master list of regulatory bodies, their tier classification, and countries." />;
      case "payments": return <PlaceholderView title="Payment Methods" description="Master list of deposit/withdrawal methods — cards, wallets, crypto, bank wire." />;
      case "affiliates": return <PlaceholderView title="Affiliate Links" description="Manage affiliate URLs, discount codes, and tracking for all firms." />;
      case "seo": return <PlaceholderView title="SEO Settings" description="Global SEO settings, sitemap config, and schema markup management." />;
      case "users": return <PlaceholderView title="Team / Users" description="Manage admin users, roles, and permissions." />;
      default: return <DashboardView setActiveView={setActiveView} />;
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: COLORS.bg,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      color: COLORS.text,
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? 60 : 230,
        borderRight: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <div style={{
          padding: sidebarCollapsed ? "18px 14px" : "18px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.accent, letterSpacing: "-0.3px" }}>◆ ADMIN</div>
              <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: "1px", marginTop: 2 }}>REVIEW AGGREGATOR</div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer",
              fontSize: 16, padding: "4px", lineHeight: 1,
            }}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {sidebarSections.map((section, si) => (
            <div key={si} style={{ marginBottom: 8 }}>
              {!sidebarCollapsed && (
                <div style={{
                  padding: "8px 20px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.textDim,
                  letterSpacing: "1.2px",
                }}>{section.label}</div>
              )}
              {section.items.map(item => {
                const isActive = activeView === item.id ||
                  (item.id === "prop-firms" && activeView === "firm-editor") ||
                  (item.id === "pages" && activeView === "page-editor");
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: sidebarCollapsed ? "9px 0" : "9px 20px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      background: isActive ? COLORS.accentDim : "transparent",
                      border: "none",
                      borderRight: isActive ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                      color: isActive ? COLORS.accent : COLORS.textMuted,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.12s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = COLORS.text; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = COLORS.textMuted; }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
                    {!sidebarCollapsed && item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflow: "auto",
        padding: 32,
      }}>
        <div style={{ maxWidth: 1100 }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}
