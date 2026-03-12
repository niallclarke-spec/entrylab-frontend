import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { C, font } from "@/lib/adminTheme";
import {
  LayoutDashboard, TrendingUp, Star, Building2, ArrowLeftRight,
  FileText, PenLine, Tag, Globe, Monitor, Shield, CreditCard,
  Link2, Search, Users, LogOut, ChevronLeft, ChevronRight, Mail,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "CONTENT",
    items: [
      { id: "dashboard",          label: "Dashboard",          icon: LayoutDashboard, href: "/admin" },
      { id: "prop-firms",         label: "Prop Firms",          icon: TrendingUp,      href: "/admin/prop-firms" },
      { id: "prop-firm-reviews",  label: "Prop Firm Reviews",   icon: Star,            href: "/admin/prop-firm-reviews" },
      { id: "brokers",            label: "Brokers",             icon: Building2,       href: "/admin/brokers" },
      { id: "broker-reviews",     label: "Broker Reviews",      icon: Star,            href: "/admin/broker-reviews" },
    ],
  },
  {
    label: "EDITORIAL",
    items: [
      { id: "comparisons",  label: "Comparisons",   icon: ArrowLeftRight, href: "/admin/comparisons" },
      { id: "pages",        label: "Pages",          icon: FileText,       href: "/admin/pages" },
      { id: "posts",        label: "Blog Posts",     icon: PenLine,        href: "/admin/posts" },
      { id: "email-leads",  label: "Blog Leads",     icon: Mail,           href: "/admin/email-leads" },
    ],
  },
  {
    label: "TAXONOMY",
    items: [
      { id: "categories", label: "Categories",        icon: Tag,        href: "/admin/categories" },
      { id: "countries",  label: "Countries",          icon: Globe,      href: "/admin/countries" },
      { id: "platforms",  label: "Platforms",          icon: Monitor,    href: "/admin/platforms" },
      { id: "regulators", label: "Regulators",         icon: Shield,     href: "/admin/regulators" },
      { id: "payments",   label: "Payment Methods",    icon: CreditCard, href: "/admin/payments" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { id: "affiliates", label: "Affiliate Links", icon: Link2,  href: "/admin/affiliates" },
      { id: "seo",        label: "SEO Settings",    icon: Search, href: "/admin/seo" },
      { id: "users",      label: "Team / Users",    icon: Users,  href: "/admin/users" },
    ],
  },
];

function isActive(href: string, location: string): boolean {
  if (href === "/admin") return location === "/admin" || location === "/admin/";
  return location.startsWith(href);
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  const sidebarWidth = collapsed ? 60 : 230;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: font, color: C.text, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: "100vh",
        background: C.bg,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s ease, min-width 0.2s ease",
        zIndex: 50,
      }}>
        {/* Branding */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: collapsed ? "14px 0" : "14px 14px",
          borderBottom: `1px solid ${C.border}`,
          minHeight: 64,
        }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1, minWidth: 0 }}>
              {/* Logo mark */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={30} height={30} style={{ flexShrink: 0, borderRadius: 6 }}>
                <rect width="32" height="32" rx="6" fill={C.accent} />
                <path d="M9 9h14v3H12v4h9v3h-9v4h11v3H9V9z" fill="#0B0E11" />
              </svg>
              {/* Wordmark + subtitle */}
              <div style={{ overflow: "hidden", minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>EntryLab</div>
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.6px", whiteSpace: "nowrap", marginTop: 1 }}>ADMIN PANEL</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={28} height={28} style={{ borderRadius: 6 }}>
                <rect width="32" height="32" rx="6" fill={C.accent} />
                <path d="M9 9h14v3H12v4h9v3h-9v4h11v3H9V9z" fill="#0B0E11" />
              </svg>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", padding: 4, borderRadius: 4, display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <button
              onClick={() => setCollapsed(false)}
              style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", padding: 6, borderRadius: 4, display: "flex", alignItems: "center" }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
          {sections.map((section) => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.textDim,
                  letterSpacing: "1px",
                  padding: "14px 16px 6px",
                }}>
                  {section.label}
                </div>
              )}
              {collapsed && <div style={{ height: 10 }} />}
              {section.items.map((item) => {
                const active = isActive(item.href, location);
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.href}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: collapsed ? "9px 0" : "9px 16px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      cursor: "pointer",
                      background: active ? C.accentDim : "transparent",
                      borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = C.surfaceHover; }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <Icon size={15} color={active ? C.accent : C.textMuted} strokeWidth={active ? 2.2 : 1.8} />
                      {!collapsed && (
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.accent : C.textMuted, whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: collapsed ? "12px 0" : "12px 16px" }}>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              justifyContent: collapsed ? "center" : "flex-start",
              background: "none",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              padding: "8px 0",
              fontSize: 13,
              fontFamily: font,
            }}
            data-testid="button-logout"
          >
            <LogOut size={15} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", padding: 28, background: C.bg }}>
        {children}
      </main>
    </div>
  );
}
