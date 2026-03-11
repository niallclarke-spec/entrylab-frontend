import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, StatusBadge, ActionBtn } from "@/lib/adminTheme";

type FirmType = "prop_firm" | "broker";

interface AdminFirmsListProps {
  type: FirmType;
}

function TypeBadge({ type }: { type: string }) {
  const isProp = type === "prop_firm" || type === "prop";
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: isProp ? "rgba(75,156,242,0.1)" : "rgba(242,162,8,0.1)",
      color: isProp ? C.info : C.warning,
      border: `1px solid ${isProp ? "rgba(75,156,242,0.2)" : "rgba(242,162,8,0.2)"}`,
      whiteSpace: "nowrap" as const,
    }}>
      {isProp ? "Prop Firm" : "Broker"}
    </span>
  );
}

export default function AdminFirmsList({ type }: AdminFirmsListProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isProp = type === "prop_firm";
  const title = isProp ? "Prop Firms" : "Brokers";
  const apiPath = isProp ? "/api/prop-firms" : "/api/brokers";
  const newPath = isProp ? "/admin/prop-firms/new" : "/admin/brokers/new";
  const editBase = isProp ? "/admin/prop-firms" : "/admin/brokers";
  const deleteApiBase = isProp ? "/api/admin/prop-firms" : "/api/admin/brokers";

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: firms = [], isLoading } = useQuery<any[]>({
    queryKey: [apiPath],
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => apiRequest("DELETE", `${deleteApiBase}/${slug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
    },
  });

  const handleDelete = (slug: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(slug);
    }
  };

  if (sessionLoading) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>{title}</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              {isLoading ? "Loading..." : `${firms.length} ${title.toLowerCase()}`}
            </p>
          </div>
          <Link href={newPath}>
            <ActionBtn label={`+ Add ${isProp ? "Prop Firm" : "Broker"}`} primary />
          </Link>
        </div>

        {/* Table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading...</div>
          ) : firms.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: C.textMuted }}>
              <div style={{ fontSize: 13, marginBottom: 16 }}>No {title.toLowerCase()} found.</div>
              <Link href={newPath}>
                <ActionBtn label={`+ Add your first ${isProp ? "prop firm" : "broker"}`} primary />
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Name", "Type", "Rating", "Status", "Last Updated", ""].map((h, i) => (
                    <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firms.map((firm: any) => {
                  const slug = firm.slug;
                  const name = firm.name;
                  const logo = firm.logoUrl || firm.logo;
                  const rating = typeof firm.rating === "number" ? firm.rating : parseFloat(firm.rating) || null;
                  const status = firm.is_featured || firm.isFeatured ? "featured" : "published";
                  const updated = firm.lastUpdated || firm.last_updated || firm.updatedAt;
                  return (
                    <tr
                      key={slug}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "#fff", flexShrink: 0, border: `1px solid ${C.border}` }}>
                            {logo && !logo.includes("placehold.co") ? (
                              <img src={logo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, fontSize: 13, fontWeight: 700, color: C.textMuted }}>
                                {name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{name}</span>
                            <span style={{ display: "block", fontSize: 11, color: C.textDim, marginTop: 2 }}>{slug}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <TypeBadge type={type} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {rating ? (
                          <>
                            <span style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>{rating.toFixed(1)}</span>
                            <span style={{ color: C.textDim, fontSize: 12 }}>/10</span>
                          </>
                        ) : (
                          <span style={{ color: C.textDim, fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ padding: "14px 16px", color: C.textDim, fontSize: 12 }}>
                        {updated ? new Date(updated).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link href={`${editBase}/${slug}`}>
                            <ActionBtn label="Edit" small />
                          </Link>
                          <ActionBtn
                            label="Delete"
                            small
                            danger
                            onClick={() => handleDelete(slug, name)}
                            disabled={deleteMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
