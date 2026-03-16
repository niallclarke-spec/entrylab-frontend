import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw, CheckCircle, Archive, Zap, Search, Filter, GitCompare,
  FileText, Eye, BarChart3, FolderArchive
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ComparisonRecord } from "@shared/schema";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-200",
  published: "bg-[#2bb32a]/20 text-[#2bb32a]",
  updated: "bg-amber-500/20 text-amber-400",
  archived: "bg-zinc-600/30 text-zinc-400",
};

const TYPE_COLORS: Record<string, string> = {
  broker: "bg-blue-500/20 text-blue-400",
  prop_firm: "bg-purple-500/20 text-purple-400",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
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

export default function AdminComparisons() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const { data: stats, isLoading: statsLoading } = useQuery<{ draft: number; published: number; updated: number; archived: number }>({
    queryKey: ["/api/admin/comparisons/stats"],
  });

  const { data: comparisons, isLoading } = useQuery<ComparisonRecord[]>({
    queryKey: ["/api/admin/comparisons", filterStatus, filterType, search, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("entityType", filterType);
      if (search) params.set("q", search);
      params.set("sort", sort === "newest" ? "newest" : sort);
      const res = await fetch(`/api/admin/comparisons?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/comparisons/generate-all"),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({
        title: "Generated missing comparisons",
        description: `Created ${data.brokers} broker and ${data.propFirms} prop firm comparison drafts.`,
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/stats"] });
    },
    onError: () => toast({ title: "Failed to generate", variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { ids: string[]; action: "publish" | "archive" | "regenerate" }) =>
      apiRequest("POST", "/api/admin/comparisons/bulk", payload),
    onSuccess: (_, vars) => {
      toast({
        title: vars.action === "publish" ? "Published" : vars.action === "archive" ? "Archived" : "Regenerated",
        description: `${vars.ids.length} comparisons ${vars.action === "publish" ? "published" : vars.action === "archive" ? "archived" : "regenerated"}.`,
      });
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/stats"] });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const quickPublishMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/admin/comparisons/${id}`, { action: "publish" }),
    onSuccess: () => {
      toast({ title: "Published" });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/comparisons/stats"] });
    },
    onError: () => toast({ title: "Failed to publish", variant: "destructive" }),
  });

  const allIds = (comparisons || []).map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function getEntityName(record: ComparisonRecord, which: "a" | "b") {
    return which === "a" ? record.entityAName : (record.entityBName ?? "—");
  }

  const selectedArr = [...selectedIds];

  return (
    <div className="min-h-screen bg-[#0f1110] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-[#2bb32a]" />
              Comparisons
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Manage broker and prop firm comparison pages</p>
          </div>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            data-testid="button-generate-all"
            className="bg-[#2bb32a] hover:bg-[#239122] text-white"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate All Missing
          </Button>
        </div>

        {/* Stats */}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search by entity name…"
              className="pl-9 bg-white/5 border-white/10 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-comparisons"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white" data-testid="select-filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="updated">Needs Review</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white" data-testid="select-filter-type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="broker">Brokers</SelectItem>
              <SelectItem value="prop_firm">Prop Firms</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white" data-testid="select-sort">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg bg-[#2bb32a]/10 border border-[#2bb32a]/20">
            <span className="text-sm text-zinc-300">{selectedIds.size} selected</span>
            <Button
              size="sm"
              onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "publish" })}
              disabled={bulkMutation.isPending}
              data-testid="button-bulk-publish"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Publish Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "archive" })}
              disabled={bulkMutation.isPending}
              data-testid="button-bulk-archive"
            >
              <Archive className="w-4 h-4 mr-1" /> Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkMutation.mutate({ ids: selectedArr, action: "regenerate" })}
              disabled={bulkMutation.isPending}
              data-testid="button-bulk-regenerate"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${bulkMutation.isPending ? "animate-spin" : ""}`} /> Regenerate
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/3">
                <th className="p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="p-3 text-left text-zinc-400 font-medium">Entity A</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Entity B</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Type</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Status</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Winner</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Score</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Created</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Published</th>
                <th className="p-3 text-left text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !comparisons?.length ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-400">
                    No comparisons found. Click "Generate All Missing" to create drafts.
                  </td>
                </tr>
              ) : (
                comparisons.map((c) => {
                  const catWinners = (c.categoryWinners as any) || {};
                  const winnerName =
                    c.overallWinnerId === c.entityAId
                      ? c.entityAName
                      : c.overallWinnerId === c.entityBId
                      ? c.entityBName
                      : "Tie";
                  const prefix = c.entityType === "broker" ? "/compare/broker" : "/compare/prop-firm";
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      data-testid={`row-comparison-${c.id}`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleOne(c.id)}
                          data-testid={`checkbox-comparison-${c.id}`}
                        />
                      </td>
                      <td className="p-3 font-medium text-white">{c.entityAName}</td>
                      <td className="p-3 text-zinc-300">{c.entityBName ?? "—"}</td>
                      <td className="p-3">
                        <Badge className={`text-xs ${TYPE_COLORS[c.entityType] || ""}`}>
                          {c.entityType === "prop_firm" ? "Prop Firm" : "Broker"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`text-xs ${STATUS_COLORS[c.status] || ""}`}>
                          {c.status === "updated" ? "Needs Review" : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 text-zinc-300">{winnerName}</td>
                      <td className="p-3 text-zinc-400 font-mono">{c.overallScore ?? "—"}</td>
                      <td className="p-3 text-zinc-500 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-zinc-500 text-xs">
                        {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {(c.status === "draft" || c.status === "updated") && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-[#2bb32a]/20 text-[#2bb32a] hover:bg-[#2bb32a]/30"
                              onClick={() => quickPublishMutation.mutate(c.id)}
                              disabled={quickPublishMutation.isPending}
                              data-testid={`button-publish-${c.id}`}
                            >
                              Publish
                            </Button>
                          )}
                          {c.status === "published" && (
                            <Link
                              href={`${prefix}/${c.slug}`}
                              className="text-xs text-[#2bb32a] hover:underline"
                              data-testid={`link-view-${c.id}`}
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {comparisons && (
          <p className="text-zinc-500 text-xs mt-3">
            {comparisons.length} comparison{comparisons.length !== 1 ? "s" : ""} shown
          </p>
        )}
      </div>
    </div>
  );
}
