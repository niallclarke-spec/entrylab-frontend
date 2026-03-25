import { db } from "@/lib/db";
import { comparisonsTable } from "@/lib/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { GitCompare, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { currentYear, SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Compare Forex Brokers & Prop Firms ${currentYear()} — Side-by-Side`,
  description: "Head-to-head comparisons of forex brokers and prop trading firms. Compare regulation, fees, platforms, profit splits and more.",
  openGraph: { title: `Compare Forex Brokers & Prop Firms — Side-by-Side`, description: "Head-to-head comparisons of forex brokers and prop trading firms. Compare regulation, fees, platforms, profit splits and more.", url: `${SITE_URL}/compare` },
  alternates: { canonical: `${SITE_URL}/compare` },
};

export default async function ComparePage() {
  const [brokerComps, propFirmComps] = await Promise.all([
    db.select().from(comparisonsTable)
      .where(and(inArray(comparisonsTable.status, ["published", "updated"]), eq(comparisonsTable.entityType, "broker")))
      .orderBy(desc(comparisonsTable.updatedAt)).limit(50),
    db.select().from(comparisonsTable)
      .where(and(inArray(comparisonsTable.status, ["published", "updated"]), eq(comparisonsTable.entityType, "prop_firm")))
      .orderBy(desc(comparisonsTable.updatedAt)).limit(50),
  ]);

  return (
    <>
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <GitCompare className="h-3 w-3" /> Head-to-Head
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Compare Brokers & Prop Firms</h1>
          <p className="text-[#adb2b1] max-w-xl">Side-by-side comparisons to help you find the right fit for your trading style.</p>
        </div>
      </section>

      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {brokerComps.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Broker Comparisons</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brokerComps.map((comp) => (
                  <Link key={comp.id} href={`/compare/${comp.slug}`}
                    className="flex items-center justify-between rounded-xl p-5 transition-all hover:shadow-md"
                    style={{ background: "#fff", border: "1px solid #e8edea" }}>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{comp.entityAName} vs {comp.entityBName}</h3>
                      {comp.overallScore && <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Score: {comp.overallScore}</p>}
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {propFirmComps.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: "#111827" }}>Prop Firm Comparisons</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propFirmComps.map((comp) => (
                  <Link key={comp.id} href={`/compare/${comp.slug}`}
                    className="flex items-center justify-between rounded-xl p-5 transition-all hover:shadow-md"
                    style={{ background: "#fff", border: "1px solid #e8edea" }}>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>{comp.entityAName} vs {comp.entityBName}</h3>
                      {comp.overallScore && <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Score: {comp.overallScore}</p>}
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {brokerComps.length === 0 && propFirmComps.length === 0 && (
            <p className="text-center py-12" style={{ color: "#6b7280" }}>No comparisons available yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
