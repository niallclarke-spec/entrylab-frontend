import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronRight,
  GitCompare,
  Zap,
  CheckCircle,
  Eye,
  RefreshCw,
  FileText,
  BarChart3,
  FolderArchive,
  ExternalLink,
  Trophy,
} from "lucide-react";
import type { ComparisonRecord } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EntityStat {
  entityId: string;
  entitySlug: string;
  entityName: string;
  generated: number;
  published: number;
  total: number;
}

// ─── Status / colour helpers ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-200",
    published: "bg-[#2bb32a]/20 text-[#2bb32a]",
    updated: "bg-amber-500/20 text-amber-400",
    archived: "bg-zinc-600/30 text-zinc-400",
  };
  const label =
    status === "updated"
      ? "Needs Review"
      : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge className={`text-xs ${map[status] ?? ""}`}>{label}</Badge>;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full bg-[#2bb32a] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 tabular-nums whitespace-nowrap">
        {value}/{max}
      </span>
    </div>
  );
}

// ─── Entity Row (accordion) ───────────────────────────────────────────────────

function EntityRow({
  stat,
  entityType,
}: {
  stat: EntityStat;
  entityType: "broker" | "prop_firm";
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const prefix = entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";

  // Lazy-load this entity's comparisons only when expanded
  const { data: comparisons, isLoading: cmpsLoading } = useQuery<ComparisonRecord[]>({
    queryKey: [`/api/admin/comparisons/for-entity/${entityType}/${stat.entityId}`],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/comparisons/for-entity/${entityType}/${stat.entityId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open,
    staleTime: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiRequest(
        "POST",
        `/api/admin/comparisons/generate-next/${entityType}/${stat.entityId}`
      ),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.created) {
        toast({
          title: "Comparison generated",
          description: `${stat.entityName} vs ${data.comparison?.entityAName === stat.entityName ? data.comparison?.entityBName : data.comparison?.entityAName} — draft ready. ${data.remaining} remaining.`,
        });
      } else {
        toast({ title: "All comparisons already generated", description: `${stat.entityName} has all ${stat.total} comparisons.` });
      }
      qc.invalidateQueries({ queryKey: [`/api/admin/comparisons/entity-stats/${entityType}`] });
      qc.invalidateQueries({ queryKey: [`/api/admin/comparisons/for-entity/${entityType}/${stat.entityId}`] });
    },
    onError: () => toast({ title: "Failed to generate", variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PUT", `/api/admin/comparisons/${id}`, { action: "publish" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/admin/comparisons/for-entity/${entityType}/${stat.entityId}`] });
      qc.invalidateQueries({ queryKey: [`/api/admin/comparisons/entity-stats/${entityType}`] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/stats"] });
      toast({ title: "Published" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const allDone = stat.generated >= stat.total;
  const remaining = stat.total - stat.generated;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden" data-testid={`entity-row-${stat.entityId}`}>
      {/* Header */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/5 cursor-pointer transition-colors select-none"
        onClick={() => setOpen((p) => !p)}
        data-testid={`entity-toggle-${stat.entityId}`}
      >
        {/* Expand icon */}
        <div className="text-zinc-500 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        {/* Entity name */}
        <span className="font-semibold text-white flex-1 min-w-0 truncate">{stat.entityName}</span>

        {/* Progress */}
        <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
          {/* Published counter */}
          <div className="text-center min-w-[60px]">
            <p className="text-lg font-bold text-[#2bb32a] leading-tight">{stat.published}</p>
            <p className="text-[10px] text-zinc-500 leading-tight">published</p>
          </div>

          {/* Generated progress bar */}
          <div className="min-w-[120px]">
            <p className="text-[10px] text-zinc-500 mb-1">Generated</p>
            <ProgressBar value={stat.generated} max={stat.total} />
          </div>

          {/* Generate Next CTA */}
          <div onClick={(e) => e.stopPropagation()}>
            {allDone ? (
              <Badge className="bg-[#2bb32a]/20 text-[#2bb32a] text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> All {stat.total} generated
              </Badge>
            ) : (
              <Button
                size="sm"
                className="bg-[#2bb32a]/20 text-[#2bb32a] hover:bg-[#2bb32a]/30 h-7 text-xs"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid={`button-generate-next-${stat.entityId}`}
              >
                {generateMutation.isPending ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 mr-1" />
                )}
                {stat.generated === 0
                  ? "Generate First"
                  : `Generate Next (${remaining} left)`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded comparisons list */}
      {open && (
        <div className="border-t border-white/10 divide-y divide-white/5">
          {cmpsLoading ? (
            <div className="px-4 py-3 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !comparisons?.length ? (
            <div className="px-4 py-6 text-center text-zinc-500 text-sm">
              No comparisons yet.{" "}
              <button
                className="text-[#2bb32a] hover:underline"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
              >
                Generate the first one
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="px-4 py-2 grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 text-xs text-zinc-500 bg-white/2">
                <span>Comparison</span>
                <span>Status</span>
                <span>Score</span>
                <span>Winner</span>
                <span className="text-right">Actions</span>
              </div>

              {comparisons.map((c) => {
                const opponentName =
                  c.entityAId === stat.entityId ? c.entityBName : c.entityAName;
                const winnerName =
                  c.overallWinnerId === c.entityAId
                    ? c.entityAName
                    : c.overallWinnerId === c.entityBId
                    ? c.entityBName
                    : "Tie";
                return (
                  <div
                    key={c.id}
                    className="px-4 py-2.5 grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 items-center hover:bg-white/2 transition-colors"
                    data-testid={`comparison-row-${c.id}`}
                  >
                    <span className="text-sm text-zinc-200 truncate">
                      {stat.entityName} vs {opponentName}
                    </span>
                    <StatusBadge status={c.status} />
                    <span className="text-xs font-mono text-zinc-400">{c.overallScore ?? "—"}</span>
                    <span className="text-xs text-zinc-400 truncate flex items-center gap-1">
                      {winnerName !== "Tie" && <Trophy className="w-3 h-3 text-[#2bb32a] flex-shrink-0" />}
                      {winnerName}
                    </span>
                    <div className="flex items-center gap-2 justify-end">
                      {(c.status === "draft" || c.status === "updated") && (
                        <Button
                          size="sm"
                          className="h-6 text-xs bg-[#2bb32a]/20 text-[#2bb32a] hover:bg-[#2bb32a]/30"
                          onClick={() => publishMutation.mutate(c.id)}
                          disabled={publishMutation.isPending}
                          data-testid={`button-publish-${c.id}`}
                        >
                          Publish
                        </Button>
                      )}
                      {c.status === "published" && (
                        <Link
                          href={`${prefix}/${c.slug}`}
                          className="text-xs text-[#2bb32a] flex items-center gap-1 hover:underline"
                          data-testid={`link-view-${c.id}`}
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center gap-4">
      <div className={`p-2 rounded-md ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AdminComparisons() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"broker" | "prop_firm">("broker");

  const { data: stats, isLoading: statsLoading } = useQuery<{
    draft: number;
    published: number;
    updated: number;
    archived: number;
  }>({
    queryKey: ["/api/admin/comparisons/stats"],
  });

  const { data: brokerStats, isLoading: brokerLoading } = useQuery<EntityStat[]>({
    queryKey: ["/api/admin/comparisons/entity-stats/broker"],
    queryFn: async () => {
      const res = await fetch("/api/admin/comparisons/entity-stats/broker", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: propFirmStats, isLoading: propFirmLoading } = useQuery<EntityStat[]>({
    queryKey: ["/api/admin/comparisons/entity-stats/prop_firm"],
    queryFn: async () => {
      const res = await fetch("/api/admin/comparisons/entity-stats/prop_firm", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const generateAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/comparisons/generate-all"),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({
        title: "All missing drafts generated",
        description: `${data.brokers} broker pairs, ${data.propFirms} prop firm pairs, ${data.brokerAlternatives} broker alts, ${data.propFirmAlternatives} prop firm alts.`,
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/entity-stats/broker"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/entity-stats/prop_firm"] });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const activeStats = tab === "broker" ? brokerStats : propFirmStats;
  const activeLoading = tab === "broker" ? brokerLoading : propFirmLoading;

  const totalGenerated = activeStats?.reduce((s, e) => s + e.generated, 0) ?? 0;
  const totalPossible = activeStats
    ? activeStats.length > 0
      ? activeStats[0].total * activeStats.length
      : 0
    : 0;
  const totalPublished = activeStats?.reduce((s, e) => s + e.published, 0) ?? 0;

  return (
    <div className="min-h-screen bg-[#0f1110] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-[#2bb32a]" />
              Comparisons
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Manage comparison articles for every broker and prop firm pair
            </p>
          </div>
          <Button
            onClick={() => generateAllMutation.mutate()}
            disabled={generateAllMutation.isPending}
            data-testid="button-generate-all"
            variant="outline"
            className="border-white/20 text-zinc-300 hover:text-white"
          >
            {generateAllMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate All Missing
          </Button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : (
            <>
              <StatCard label="Drafts" value={stats?.draft ?? 0} icon={FileText} color="bg-zinc-700/50 text-zinc-300" />
              <StatCard label="Published" value={stats?.published ?? 0} icon={Eye} color="bg-[#2bb32a]/20 text-[#2bb32a]" />
              <StatCard label="Needs Review" value={stats?.updated ?? 0} icon={BarChart3} color="bg-amber-500/20 text-amber-400" />
              <StatCard label="Archived" value={stats?.archived ?? 0} icon={FolderArchive} color="bg-zinc-600/30 text-zinc-400" />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
          {(["broker", "prop_firm"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-[#2bb32a] text-[#2bb32a]"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
              data-testid={`tab-${t}`}
            >
              {t === "broker" ? "Brokers" : "Prop Firms"}
              {activeStats && tab === t && (
                <span className="ml-2 text-xs text-zinc-500">({activeStats.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab summary strip */}
        {!activeLoading && activeStats && (
          <div className="flex flex-wrap gap-4 items-center mb-5 px-1">
            <span className="text-sm text-zinc-400">
              <span className="text-white font-semibold">{totalPublished}</span> published ·{" "}
              <span className="text-white font-semibold">{totalGenerated}</span> total generated ·{" "}
              overall{" "}
              <span className="text-[#2bb32a] font-semibold">
                {totalPossible > 0 ? Math.round((totalGenerated / totalPossible) * 100) : 0}%
              </span>{" "}
              complete
            </span>
          </div>
        )}

        {/* Entity list */}
        <div className="space-y-2">
          {activeLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : !activeStats?.length ? (
            <div className="text-center py-12 text-zinc-500">
              No {tab === "broker" ? "brokers" : "prop firms"} found.
            </div>
          ) : (
            activeStats.map((stat) => (
              <EntityRow key={stat.entityId} stat={stat} entityType={tab} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
