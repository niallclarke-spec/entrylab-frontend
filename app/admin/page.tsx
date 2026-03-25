"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./layout";
import { Shield, TrendingUp, FileText, GitCompare, Eye } from "lucide-react";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch("/api/admin/brokers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/prop-firms", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/articles", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/comparisons", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([brokers, firms, articles, comparisons]) => {
      setStats({
        brokers: Array.isArray(brokers) ? brokers.length : 0,
        propFirms: Array.isArray(firms) ? firms.length : 0,
        articles: Array.isArray(articles) ? articles.length : 0,
        comparisons: Array.isArray(comparisons) ? comparisons.length : 0,
        publishedArticles: Array.isArray(articles) ? articles.filter((a: any) => a.status === "published").length : 0,
        draftComparisons: Array.isArray(comparisons) ? comparisons.filter((c: any) => c.status === "draft").length : 0,
      });
    });
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Dashboard</h1>

      {stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Brokers", value: stats.brokers, icon: Shield, color: "#2bb32a" },
            { label: "Prop Firms", value: stats.propFirms, icon: TrendingUp, color: "#3b82f6" },
            { label: "Articles", value: `${stats.publishedArticles}/${stats.articles}`, icon: FileText, color: "#f59e0b" },
            { label: "Comparisons", value: `${stats.comparisons - stats.draftComparisons}/${stats.comparisons}`, icon: GitCompare, color: "#8b5cf6" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid #e8edea" }}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: "#111827" }}>{stat.value}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "#6b7280" }}>Loading stats...</p>
      )}
    </div>
  );
}
