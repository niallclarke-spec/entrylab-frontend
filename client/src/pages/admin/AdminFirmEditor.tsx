import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, ActionBtn } from "@/lib/adminTheme";
import RichTextEditor from "@/components/admin/RichTextEditor";

type FirmType = "prop_firm" | "broker";

interface AdminFirmEditorProps {
  type: FirmType;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const PROP_TABS = [
  { id: "general",    label: "General Info" },
  { id: "challenges", label: "Challenge Plans" },
  { id: "rules",      label: "Trading Rules" },
  { id: "editorial",  label: "Editorial" },
  { id: "regulation", label: "Regulation" },
  { id: "platforms",  label: "Platforms" },
  { id: "instruments",label: "Instruments" },
  { id: "payments",   label: "Payments" },
  { id: "countries",  label: "Countries" },
  { id: "affiliate",  label: "Affiliate" },
  { id: "seo",        label: "SEO" },
];

const BROKER_TABS = [
  { id: "general",   label: "General Info" },
  { id: "accounts",  label: "Broker Accounts" },
  { id: "rules",     label: "Trading Rules" },
  { id: "editorial", label: "Editorial" },
  { id: "regulation",label: "Regulation" },
  { id: "platforms", label: "Platforms" },
  { id: "instruments",label: "Instruments" },
  { id: "payments",  label: "Payments" },
  { id: "countries", label: "Countries" },
  { id: "affiliate", label: "Affiliate" },
  { id: "seo",       label: "SEO" },
];

function FormGroup({ label, hint, children, span }: { label: string; hint?: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 6, letterSpacing: "0.3px" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function DInput({ placeholder, type = "text", value = "", onChange }: { placeholder?: string; type?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; }}
    />
  );
}

function DSelect({ options, value, onChange, placeholder }: { options: string[]; value?: string; onChange?: (v: string) => void; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: value ? C.text : C.textDim, fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box", appearance: "none" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function DTextArea({ placeholder, rows = 4, value = "", onChange }: { placeholder?: string; rows?: number; value?: string; onChange?: (v: string) => void }) {
  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: font, outline: "none", boxSizing: "border-box", resize: "vertical" }}
      onFocus={(e) => { e.target.style.borderColor = C.accent; }}
      onBlur={(e) => { e.target.style.borderColor = C.border; }}
    />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onChange(!checked)}>
      <div style={{ width: 38, height: 20, borderRadius: 10, background: checked ? C.accent : C.border, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: checked ? 20 : 2, transition: "left 0.2s" }} />
      </div>
      <span style={{ fontSize: 13, color: C.text }}>{label}</span>
    </div>
  );
}

function PlaceholderTab({ tabLabel }: { tabLabel: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: C.textDim }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>◎</div>
      <div style={{ fontSize: 14, color: C.textMuted }}>Tab: <strong style={{ color: C.accent }}>{tabLabel}</strong></div>
      <div style={{ fontSize: 13, marginTop: 8, color: C.textDim, maxWidth: 400, margin: "8px auto 0" }}>
        Form fields for this section follow the same pattern — select from reference data, toggle options, and input values.
      </div>
    </div>
  );
}

export default function AdminFirmEditor({ type }: AdminFirmEditorProps) {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;
  const isNew = !slug;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isProp = type === "prop_firm";
  const tabs = isProp ? PROP_TABS : BROKER_TABS;
  const [activeTab, setActiveTab] = useState("general");
  const listPath = isProp ? "/admin/prop-firms" : "/admin/brokers";

  const [form, setForm] = useState({
    name: "", slug: "", website: "", foundedYear: "", hqCity: "", hqCountry: "",
    parentCompany: "", ceo: "", description: "", rating: "", trustpilot: "",
    isVerified: false, isFeatured: false, isPubliclyTraded: false,
    promoCode: "", discountAmount: "", content: "", pros: ["", ""], cons: ["", ""],
    affiliateLink: "", seoTitle: "", seoDescription: "", tagline: "",
    profitSplit: "", maxFundingSize: "", evaluationFee: "",
    minDeposit: "", maxLeverage: "", spreadFrom: "", regulation: "", platforms: "", paymentMethods: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const apiGetPath = isProp ? `/api/prop-firms/${slug}` : `/api/brokers/${slug}`;
  const { data: existing, isLoading: firmLoading } = useQuery<any>({
    queryKey: [apiGetPath],
    queryFn: () => fetch(apiGetPath, { credentials: "include" }).then((r) => r.json()),
    enabled: !isNew && !!session,
  });

  useEffect(() => {
    if (existing && !firmLoading) {
      setForm((f) => ({
        ...f,
        name: existing.name || "",
        slug: existing.slug || "",
        website: existing.website || existing.affiliateLink || "",
        rating: existing.rating ? String(existing.rating) : "",
        tagline: existing.tagline || "",
        content: existing.content || "",
        pros: existing.pros?.length ? existing.pros : ["", ""],
        cons: existing.cons?.length ? existing.cons : ["", ""],
        affiliateLink: existing.affiliateLink || existing.link || "",
        seoTitle: existing.seoTitle || existing.seo_title || "",
        seoDescription: existing.seoDescription || existing.seo_description || "",
        isFeatured: existing.isFeatured || existing.featured || false,
        isVerified: existing.isVerified || existing.verified || false,
        minDeposit: existing.minDeposit || "",
        maxLeverage: existing.maxLeverage || "",
        spreadFrom: existing.spreadFrom || "",
        regulation: existing.regulation || "",
        platforms: existing.platforms || "",
        paymentMethods: existing.paymentMethods || "",
        profitSplit: existing.profitSplit || existing.profit_split || "",
        maxFundingSize: existing.maxFundingSize || existing.max_funding_size || "",
        evaluationFee: existing.evaluationFee || existing.evaluation_fee || "",
      }));
      setSlugTouched(true);
    }
  }, [existing, firmLoading]);

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val, slug: slugTouched ? f.slug : slugify(val) }));
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        tagline: form.description || form.tagline,
        content: form.content,
        affiliateLink: form.affiliateLink || form.website,
        rating: form.rating,
        pros: form.pros.filter(Boolean),
        cons: form.cons.filter(Boolean),
        isFeatured: form.isFeatured,
        isVerified: form.isVerified,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        ...(isProp ? {
          profitSplit: form.profitSplit,
          maxFundingSize: form.maxFundingSize,
          evaluationFee: form.evaluationFee,
        } : {
          minDeposit: form.minDeposit,
          maxLeverage: form.maxLeverage,
          spreadFrom: form.spreadFrom,
          regulation: form.regulation,
          platforms: form.platforms,
          paymentMethods: form.paymentMethods,
        }),
      };
      if (isNew) {
        const createPath = isProp ? "/api/admin/prop-firms" : "/api/admin/brokers";
        return apiRequest("POST", createPath, payload);
      } else {
        const updatePath = isProp ? `/api/prop-firms/${slug}` : `/api/brokers/${slug}`;
        return apiRequest("PUT", updatePath, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [isProp ? "/api/prop-firms" : "/api/brokers"] });
      navigate(listPath);
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to save. Slug may already exist.");
    },
  });

  const setFormField = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  if (sessionLoading || (!isNew && firmLoading)) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate(listPath)}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textMuted, padding: "6px 12px", cursor: "pointer", fontSize: 14 }}
            >
              ←
            </button>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>
                {isNew ? `New ${isProp ? "Prop Firm" : "Broker"}` : form.name || "Edit"}
              </h2>
              <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>Fill in details across each tab</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {saveError && <span style={{ fontSize: 12, color: C.danger }}>{saveError}</span>}
            <ActionBtn label="Cancel" onClick={() => navigate(listPath)} />
            <ActionBtn
              label={saveMutation.isPending ? "Saving..." : "Save"}
              primary
              onClick={() => { setSaveError(""); saveMutation.mutate(); }}
              disabled={saveMutation.isPending || !form.name}
            />
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px", background: "none", border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? C.accent : "transparent"}`,
                color: activeTab === tab.id ? C.accent : C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font,
                whiteSpace: "nowrap", letterSpacing: "0.2px", transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>

          {/* GENERAL */}
          {activeTab === "general" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <FormGroup label="FIRM NAME">
                <DInput placeholder={isProp ? "e.g. FTMO" : "e.g. IC Markets"} value={form.name} onChange={handleNameChange} />
              </FormGroup>
              <FormGroup label="TYPE">
                <DSelect options={isProp ? ["Prop Firm"] : ["Broker"]} value={isProp ? "Prop Firm" : "Broker"} />
              </FormGroup>
              <FormGroup label="SLUG" hint="Auto-generated from name, editable">
                <DInput placeholder="e.g. ftmo" value={form.slug} onChange={(v) => { setSlugTouched(true); setFormField("slug", v); }} />
              </FormGroup>
              <FormGroup label="WEBSITE / AFFILIATE URL">
                <DInput placeholder="https://" value={form.affiliateLink || form.website} onChange={(v) => setFormField("affiliateLink", v)} />
              </FormGroup>
              <FormGroup label="FOUNDED YEAR">
                <DInput placeholder="2018" type="number" value={form.foundedYear} onChange={(v) => setFormField("foundedYear", v)} />
              </FormGroup>
              <FormGroup label="HEADQUARTERS">
                <div style={{ display: "flex", gap: 10 }}>
                  <DInput placeholder="City" value={form.hqCity} onChange={(v) => setFormField("hqCity", v)} />
                  <DInput placeholder="Country" value={form.hqCountry} onChange={(v) => setFormField("hqCountry", v)} />
                </div>
              </FormGroup>
              <FormGroup label="PARENT COMPANY">
                <DInput placeholder="Optional" value={form.parentCompany} onChange={(v) => setFormField("parentCompany", v)} />
              </FormGroup>
              <FormGroup label="CEO / FOUNDER">
                <DInput placeholder="Optional" value={form.ceo} onChange={(v) => setFormField("ceo", v)} />
              </FormGroup>
              <FormGroup label="SHORT DESCRIPTION" hint="Used in cards and list pages" span={2}>
                <DTextArea placeholder="One-liner about this firm..." rows={2} value={form.tagline} onChange={(v) => setFormField("tagline", v)} />
              </FormGroup>

              {isProp && (
                <>
                  <FormGroup label="PROFIT SPLIT">
                    <DInput placeholder="e.g. 80%–90%" value={form.profitSplit} onChange={(v) => setFormField("profitSplit", v)} />
                  </FormGroup>
                  <FormGroup label="MAX FUNDING SIZE">
                    <DInput placeholder="e.g. $400,000" value={form.maxFundingSize} onChange={(v) => setFormField("maxFundingSize", v)} />
                  </FormGroup>
                  <FormGroup label="EVALUATION FEE (from)">
                    <DInput placeholder="e.g. $99" value={form.evaluationFee} onChange={(v) => setFormField("evaluationFee", v)} />
                  </FormGroup>
                </>
              )}

              {!isProp && (
                <>
                  <FormGroup label="MIN. DEPOSIT">
                    <DInput placeholder="e.g. $200" value={form.minDeposit} onChange={(v) => setFormField("minDeposit", v)} />
                  </FormGroup>
                  <FormGroup label="MAX LEVERAGE">
                    <DInput placeholder="e.g. 1:500" value={form.maxLeverage} onChange={(v) => setFormField("maxLeverage", v)} />
                  </FormGroup>
                  <FormGroup label="SPREAD FROM">
                    <DInput placeholder="e.g. 0.0 pips" value={form.spreadFrom} onChange={(v) => setFormField("spreadFrom", v)} />
                  </FormGroup>
                  <FormGroup label="REGULATION">
                    <DInput placeholder="e.g. FCA, ASIC, CySEC" value={form.regulation} onChange={(v) => setFormField("regulation", v)} />
                  </FormGroup>
                </>
              )}

              <FormGroup label="RATINGS & TRUST" span={1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: C.textDim, marginBottom: 4, display: "block" }}>Your Rating (0–10)</label>
                      <DInput placeholder="8.5" type="number" value={form.rating} onChange={(v) => setFormField("rating", v)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: C.textDim, marginBottom: 4, display: "block" }}>Trustpilot Rating</label>
                      <DInput placeholder="4.7" type="number" value={form.trustpilot} onChange={(v) => setFormField("trustpilot", v)} />
                    </div>
                  </div>
                  <Toggle label="Verified by us" checked={form.isVerified} onChange={(v) => setFormField("isVerified", v)} />
                  <Toggle label="Publicly traded" checked={form.isPubliclyTraded} onChange={(v) => setFormField("isPubliclyTraded", v)} />
                  <Toggle label="Featured on homepage" checked={form.isFeatured} onChange={(v) => setFormField("isFeatured", v)} />
                </div>
              </FormGroup>

              <FormGroup label="PROMO / DISCOUNT" span={1}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <DInput placeholder="Promo code" value={form.promoCode} onChange={(v) => setFormField("promoCode", v)} />
                  <DInput placeholder="Discount %" type="number" value={form.discountAmount} onChange={(v) => setFormField("discountAmount", v)} />
                </div>
              </FormGroup>
            </div>
          )}

          {/* CHALLENGES (prop only) */}
          {activeTab === "challenges" && isProp && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Define evaluation challenge plans for this prop firm</p>
                <ActionBtn label="+ Add Plan" primary />
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <FormGroup label="PLAN NAME"><DInput placeholder="Standard 100K" /></FormGroup>
                  <FormGroup label="CHALLENGE TYPE">
                    <DSelect options={["1-Step", "2-Step", "3-Step", "Instant Funding"]} placeholder="Select..." />
                  </FormGroup>
                  <FormGroup label="ACCOUNT SIZE"><DInput placeholder="100000" type="number" /></FormGroup>
                  <FormGroup label="EVALUATION FEE ($)"><DInput placeholder="499" type="number" /></FormGroup>
                  <FormGroup label="ACTIVATION FEE ($)"><DInput placeholder="0" type="number" /></FormGroup>
                  <FormGroup label="RESET FEE ($)"><DInput placeholder="199" type="number" /></FormGroup>
                  <FormGroup label="PROFIT TARGET PH.1 (%)"><DInput placeholder="8" type="number" /></FormGroup>
                  <FormGroup label="PROFIT TARGET PH.2 (%)"><DInput placeholder="5" type="number" /></FormGroup>
                  <FormGroup label="DAILY DRAWDOWN (%)"><DInput placeholder="5" type="number" /></FormGroup>
                  <FormGroup label="MAX DRAWDOWN (%)"><DInput placeholder="10" type="number" /></FormGroup>
                  <FormGroup label="DRAWDOWN TYPE">
                    <DSelect options={["Static", "Trailing (EOD)", "Trailing (Realtime)", "Equity-Based", "Balance-Based"]} placeholder="Select..." />
                  </FormGroup>
                  <FormGroup label="PROFIT SPLIT (%)">
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <DInput placeholder="80" type="number" />
                      <span style={{ color: C.textDim, flexShrink: 0 }}>to</span>
                      <DInput placeholder="90" type="number" />
                    </div>
                  </FormGroup>
                  <FormGroup label="MIN TRADING DAYS"><DInput placeholder="5" type="number" /></FormGroup>
                  <FormGroup label="MAX TRADING DAYS"><DInput placeholder="Unlimited" /></FormGroup>
                  <FormGroup label="PAYOUT FREQUENCY">
                    <DSelect options={["On Demand", "Bi-Weekly", "Monthly", "Weekly"]} placeholder="Select..." />
                  </FormGroup>
                  <FormGroup label="FIRST PAYOUT (DAYS)"><DInput placeholder="14" type="number" /></FormGroup>
                  <FormGroup label="MAX FUNDED BALANCE"><DInput placeholder="400000" type="number" /></FormGroup>
                  <FormGroup label="MAX POSITION SIZE"><DInput placeholder="100 lots" /></FormGroup>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
                  <Toggle label="Consistency rule" checked={false} onChange={() => {}} />
                  <Toggle label="Fee refundable on pass" checked={true} onChange={() => {}} />
                  <Toggle label="Free retry on fail" checked={false} onChange={() => {}} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <FormGroup label="SCALING PLAN DETAILS">
                    <DTextArea placeholder="Describe scaling milestones..." rows={3} />
                  </FormGroup>
                </div>
              </div>
            </div>
          )}

          {/* RULES */}
          {activeTab === "rules" && (
            <div>
              <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 20px" }}>Toggle which strategies and behaviours are permitted</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  "News Trading", "Weekend Holding", "Expert Advisors (EAs)", "Copy Trading",
                  "Scalping", "Hedging", "Martingale", "Overnight Positions",
                  "Grid Trading", "High-Frequency Trading",
                ].map((rule, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: C.bg, borderRadius: 8, border: `1px solid ${C.border}` }}>
                    <Toggle label={rule} checked={["News Trading", "Expert Advisors (EAs)", "Scalping", "Hedging", "Overnight Positions"].includes(rule)} onChange={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDITORIAL */}
          {activeTab === "editorial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <FormGroup label="FULL REVIEW">
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => setFormField("content", v)}
                  placeholder="Write your in-depth editorial review here..."
                />
              </FormGroup>
              <FormGroup label="PROS">
                {form.pros.map((pro, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.accent, fontWeight: 700, lineHeight: "38px", flexShrink: 0 }}>+</span>
                    <DInput placeholder="Add a pro..." value={pro} onChange={(v) => { const next = [...form.pros]; next[i] = v; setFormField("pros", next); }} />
                  </div>
                ))}
                <button onClick={() => setFormField("pros", [...form.pros, ""])} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", fontFamily: font, padding: "4px 0" }}>
                  + Add another pro
                </button>
              </FormGroup>
              <FormGroup label="CONS">
                {form.cons.map((con, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.danger, fontWeight: 700, lineHeight: "38px", flexShrink: 0 }}>−</span>
                    <DInput placeholder="Add a con..." value={con} onChange={(v) => { const next = [...form.cons]; next[i] = v; setFormField("cons", next); }} />
                  </div>
                ))}
                <button onClick={() => setFormField("cons", [...form.cons, ""])} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", fontFamily: font, padding: "4px 0" }}>
                  + Add another con
                </button>
              </FormGroup>
            </div>
          )}

          {/* REGULATION */}
          {activeTab === "regulation" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Add regulatory licences held by this firm</p>
                <ActionBtn label="+ Add Licence" primary />
              </div>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <FormGroup label="REGULATOR">
                    <DSelect options={["FCA (UK)", "CySEC (Cyprus)", "ASIC (Australia)", "BaFin (Germany)", "FSCA (South Africa)", "FSC (Belize)", "VFSC (Vanuatu)", "Other..."]} placeholder="Select regulator..." />
                  </FormGroup>
                  <FormGroup label="REGULATORY TIER">
                    <DSelect options={["Tier 1 — Highly Trusted", "Tier 2 — Trusted", "Tier 3 — Average Risk", "Tier 4 — High Risk", "Offshore", "Unregulated"]} placeholder="Select tier..." />
                  </FormGroup>
                  <FormGroup label="LICENCE NUMBER"><DInput placeholder="e.g. FRN 195355" /></FormGroup>
                  <FormGroup label="ENTITY NAME"><DInput placeholder="Legal entity name" /></FormGroup>
                  <FormGroup label="COUNTRY"><DInput placeholder="United Kingdom" /></FormGroup>
                  <FormGroup label=" ">
                    <div style={{ paddingTop: 20 }}><Toggle label="Primary regulation" checked={true} onChange={() => {}} /></div>
                  </FormGroup>
                </div>
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === "seo" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 640 }}>
              <FormGroup label="SEO TITLE">
                <DInput placeholder="e.g. FTMO Review 2026 | EntryLab" value={form.seoTitle} onChange={(v) => setFormField("seoTitle", v)} />
              </FormGroup>
              <FormGroup label="META DESCRIPTION" hint={`${form.seoDescription.length}/160 characters`}>
                <DTextArea placeholder="Compelling meta description for search engines..." rows={3} value={form.seoDescription} onChange={(v) => setFormField("seoDescription", v)} />
              </FormGroup>
            </div>
          )}

          {/* AFFILIATE */}
          {activeTab === "affiliate" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 700 }}>
              <FormGroup label="AFFILIATE LINK" span={2}>
                <DInput placeholder="https://track.example.com/..." value={form.affiliateLink} onChange={(v) => setFormField("affiliateLink", v)} />
              </FormGroup>
              <FormGroup label="PROMO CODE">
                <DInput placeholder="e.g. ENTRYLAB10" value={form.promoCode} onChange={(v) => setFormField("promoCode", v)} />
              </FormGroup>
              <FormGroup label="DISCOUNT AMOUNT">
                <DInput placeholder="10" type="number" value={form.discountAmount} onChange={(v) => setFormField("discountAmount", v)} />
              </FormGroup>
            </div>
          )}

          {/* Placeholder tabs */}
          {!["general", "challenges", "rules", "editorial", "regulation", "seo", "affiliate"].includes(activeTab) && (
            <PlaceholderTab tabLabel={tabs.find((t) => t.id === activeTab)?.label || activeTab} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
