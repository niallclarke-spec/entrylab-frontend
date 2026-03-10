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
  id: number;
  firm: string;
  author: string;
  rating: number;
  status: string;
  date: string;
  excerpt: string;
}

const FILTERS = ["all", "pending", "approved", "flagged"] as const;

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: C.warning, fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export default function AdminReviews({ type }: AdminReviewsProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const isProp = type === "prop-firm-reviews";
  const title = isProp ? "Prop Firm Reviews" : "Broker Reviews";

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) navigate("/admin/login");
  }, [session, sessionLoading, navigate]);

  const { data: reviewsRaw, isLoading } = useQuery({
    queryKey: ["/api/admin/reviews", type],
    queryFn: () =>
      fetch(`/api/admin/reviews`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!session,
  });
  const reviews: Review[] = Array.isArray(reviewsRaw) ? reviewsRaw : [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PUT", `/api/admin/reviews/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews", type] });
    },
  });

  const displayed = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (sessionLoading) return null;

  return (
    <AdminLayout>
      <div style={{ fontFamily: font }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, fontFamily: font }}>{title}</h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>
            {pendingCount} pending review{pendingCount !== 1 ? "s" : ""}
          </p>
        </div>

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
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 20,
              }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{review.firm}</span>
                    <span style={{ color: C.textDim, fontSize: 12, marginLeft: 8 }}>by {review.author}</span>
                    <span style={{ color: C.textDim, fontSize: 12, marginLeft: 8 }}>• {review.date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <StarRating rating={review.rating} />
                    <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{review.rating.toFixed(1)}</span>
                    <StatusBadge status={review.status} />
                  </div>
                </div>
                {/* Excerpt */}
                <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.55 }}>
                  {review.excerpt}
                  {review.excerpt.length >= 178 ? "..." : ""}
                </p>
                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <ActionBtn
                    label="Approve"
                    small
                    primary
                    onClick={() => updateMutation.mutate({ id: review.id, status: "approved" })}
                    disabled={updateMutation.isPending || review.status === "approved"}
                  />
                  <ActionBtn
                    label="Reject"
                    small
                    danger
                    onClick={() => updateMutation.mutate({ id: review.id, status: "flagged" })}
                    disabled={updateMutation.isPending || review.status === "flagged"}
                  />
                  <ActionBtn label="View Full" small />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
