import { db } from "@/lib/db";
import { propFirmsTable } from "@/lib/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Star, TrendingUp, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { currentYear } from "@/lib/utils";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const year = currentYear();
  return {
    title: `Prop Firm Reviews ${year} — Evaluation, Profit Splits & Payouts`,
    description: `Compare ${year}'s best proprietary trading firms. Evaluation rules, profit splits, max funding, and payout processes reviewed independently.`,
    openGraph: {
      title: `Prop Firm Reviews ${year} — Evaluation, Profit Splits & Payouts`,
      description: `Compare ${year}'s best proprietary trading firms.`,
      url: "https://entrylab.io/prop-firms",
    },
    alternates: { canonical: "https://entrylab.io/prop-firms" },
  };
}

export default async function PropFirmsPage() {
  const firms = await db.select().from(propFirmsTable).orderBy(asc(propFirmsTable.name));

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <TrendingUp className="h-3 w-3" /> Verified & Rated
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Prop Firm Reviews {currentYear()}</h1>
          <p className="text-[#adb2b1] max-w-xl">
            Compare funded trading firms by profit splits, evaluation fees, challenge types, and payout processes.
          </p>
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>{firms.length} prop firms reviewed</p>
          <div className="grid gap-4">
            {firms.map((firm, i) => (
              <Link
                key={firm.id}
                href={`/prop-firms/${firm.slug}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-5 transition-all hover:shadow-md"
                style={{ background: "#fff", border: "1px solid #e8edea" }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm font-medium w-8 text-center" style={{ color: "#9ca3af" }}>#{i + 1}</span>
                  {firm.logoUrl ? (
                    <img src={firm.logoUrl} alt={`${firm.name} logo`} className="w-12 h-12 rounded-lg object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-xs font-bold" style={{ color: "#999" }}>
                      {firm.name.substring(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate" style={{ color: "#111827" }}>{firm.name}</h2>
                    <p className="text-xs truncate" style={{ color: "#6b7280" }}>{firm.challengeTypes || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm" style={{ color: "#6b7280" }}>
                  {firm.profitSplit && <span>Split: {firm.profitSplit}</span>}
                  {firm.maxFundingSize && <span>Max: {firm.maxFundingSize}</span>}
                  {firm.evaluationFee && <span>Fee: {firm.evaluationFee}</span>}
                  <div className="flex items-center gap-1 font-semibold" style={{ color: "#2bb32a" }}>
                    <Star className="h-4 w-4 fill-current" />
                    {Number(firm.rating || 0).toFixed(1)}
                  </div>
                  <ArrowRight className="h-4 w-4 hidden sm:block" style={{ color: "#9ca3af" }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
