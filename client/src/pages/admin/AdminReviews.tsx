import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { C, font, StatusBadge, ActionBtn } from "@/lib/adminTheme";

type ReviewType = "prop-firm-reviews" | "broker-reviews";

interface AdminReviewsProps {
  type: ReviewType;
}

interface Review {
  id: string;
  firm: string;
  firmType: string;
  firmSlug: string;
  author: string;
  email: string;
  rating: number;
  status: string;
  date: string;
  excerpt: string;
  title: string;
  wpPostId: number | null;
  createdAt: string;
}

const FILTERS = ["all", "pending", "approved", "rejected"] as const;

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: C.warning, fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(Math.min(full, 5))}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

export default function AdminReviews({ type }: AdminReviewsProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const isProp = type === "prop-firm-reviews";
  const title = isProp ? "Prop Firm Reviews" : "Broker Reviews";
  const firmTypeFilter = isProp ? "prop_firm" : "broker";

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: reviewsRaw, isLoading } = useQuery({
    queryKey: ["/api/admin/reviews", firmTypeFilter],
    queryFn: () =>
      fetch(`/api/admin/reviews?type=${firmTypeFilter}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!session,
  });

  const reviews: Review[] = (Array.isArray(reviewsRaw) ? reviewsRaw : []);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PUT", `/api/admin/reviews/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews", firmTypeFilter] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews", firmTypeFilter] });
    },
  });

  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);
  const handleMigrateReviews = async () => {
    if (!window.confirm("Import existing WordPress reviews into the database? Existing DB reviews won't be duplicated.")) return;
    setMigrating(true);
    setMigrateResult(null);
    try {
      const r = await fetch("/api/admin/migrate-reviews", { method: "POST", credentials: "include" });
      const data = await r.json();
      setMigrateResult(`Imported ${data.imported}, skipped ${data.skipped} (already in DB).`);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    } catch {
      setMigrateResult("Migration failed.");
    } finally {
      setMigrating(false);
    }
  };

  const displayed = reviews.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    return true;
  });
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (sessionLoading) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>{title}</h2>
            <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
              {pendingCount > 0 ? (
                <span style={{ color: C.warning }}>{pendingCount} pending</span>
              ) : "All reviews moderated"} — stored in database
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ActionBtn
              label={migrating ? "Importing..." : "Import from WordPress"}
              small
              onClick={handleMigrateReviews}
              disabled={migrating}
            />
          </div>
        </div>

        {migrateResult && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(8,242,149,0.08)", border: `1px solid rgba(8,242,149,0.2)`, fontSize: 13, color: C.accent }}>
            {migrateResult}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: `1px solid ${filter === f ? C.accentBorder : C.border}`,
                background: filter === f ? C.accentDim : "transparent",
                color: filter === f ? C.accent : C.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: font,
                textTransform: "capitalize",
              }}
            >
              {f}
              {f === "pending" && pendingCount > 0 && (
                <span style={{ marginLeft: 6, background: C.warning, color: "#000", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted, fontSize: 13 }}>Loading reviews...</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: C.textMuted, fontSize: 13 }}>
            No {filter !== "all" ? filter : ""} reviews found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayed.map((review) => (
              <div key={review.id} style={{
                background: C.surface,
                border: `1px solid ${review.status === "pending" ? "rgba(251,191,36,0.25)" : C.border}`,
                borderRadius: 10,
                padding: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{review.firm}</span>
                    <span style={{ color: C.textDim, fontSize: 12, marginLeft: 8 }}>by {review.author}</span>
                    {review.email && (
                      <span style={{ color: C.textDim, fontSize: 11, marginLeft: 8 }}>({review.email})</span>
                    )}
                    <span style={{ color: C.textDim, fontSize: 12, marginLeft: 8 }}>• {review.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StarRating rating={review.rating} />
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{review.rating.toFixed(1)}</span>
                    <StatusBadge status={review.status} />
                  </div>
                </div>
                {review.title && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{review.title}</div>
                )}
                <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.55 }}>
                  {review.excerpt}{review.excerpt.length >= 178 ? "..." : ""}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {review.status !== "approved" && (
                    <ActionBtn
                      label="Approve"
                      small
                      primary
                      onClick={() => updateMutation.mutate({ id: review.id, status: "approved" })}
                      disabled={updateMutation.isPending}
                    />
                  )}
                  {review.status !== "rejected" && (
                    <ActionBtn
                      label="Reject"
                      small
                      danger
                      onClick={() => updateMutation.mutate({ id: review.id, status: "rejected" })}
                      disabled={updateMutation.isPending}
                    />
                  )}
                  {review.status === "approved" && (
                    <ActionBtn
                      label="Unpublish"
                      small
                      onClick={() => updateMutation.mutate({ id: review.id, status: "pending" })}
                      disabled={updateMutation.isPending}
                    />
                  )}
                  <ActionBtn
                    label="Delete"
                    small
                    danger
                    onClick={() => {
                      if (window.confirm(`Delete this review by ${review.author}?`)) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
