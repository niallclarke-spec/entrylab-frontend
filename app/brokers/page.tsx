import { db } from "@/lib/db";
import { brokersTable } from "@/lib/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
import { Star, Shield, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { currentYear } from "@/lib/utils";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const year = currentYear();
  return {
    title: `Forex Broker Reviews ${year} — Compare Regulated Brokers`,
    description: `Compare ${year}'s best forex brokers by regulation, spreads, leverage, and platforms. Independent, expert reviews updated regularly.`,
    openGraph: {
      title: `Forex Broker Reviews ${year} — Compare Regulated Brokers`,
      description: `Compare ${year}'s best forex brokers by regulation, spreads, leverage, and platforms.`,
      url: "https://entrylab.io/brokers",
    },
    alternates: { canonical: "https://entrylab.io/brokers" },
  };
}

export default async function BrokersPage() {
  const brokers = await db
    .select()
    .from(brokersTable)
    .orderBy(asc(brokersTable.name));

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#1a1e1c" }} className="px-4 sm:px-6 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: "rgba(43,179,42,0.1)", color: "#2bb32a" }}>
            <Shield className="h-3 w-3" /> Verified & Rated
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Forex Broker Reviews {currentYear()}
          </h1>
          <p className="text-[#adb2b1] max-w-xl">
            Compare regulated brokers by spreads, platforms, fees, and trading conditions. Every review is independent and updated regularly.
          </p>
        </div>
      </section>

      {/* Broker list */}
      <section style={{ background: "#f8faf8" }} className="px-4 sm:px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>{brokers.length} brokers reviewed</p>
          <div className="grid gap-4">
            {brokers.map((broker, i) => (
              <Link
                key={broker.id}
                href={`/brokers/${broker.slug}`}
                className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-5 transition-all hover:shadow-md"
                style={{ background: "#fff", border: "1px solid #e8edea" }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-sm font-medium w-8 text-center" style={{ color: "#9ca3af" }}>#{i + 1}</span>
                  {broker.logoUrl ? (
                    <img src={broker.logoUrl} alt={`${broker.name} logo`} className="w-12 h-12 rounded-lg object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#f0f0f0] flex items-center justify-center text-xs font-bold" style={{ color: "#999" }}>
                      {broker.name.substring(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate" style={{ color: "#111827" }}>{broker.name}</h2>
                    <p className="text-xs truncate" style={{ color: "#6b7280" }}>{broker.regulation || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm" style={{ color: "#6b7280" }}>
                  {broker.minDeposit && <span>Min: {broker.minDeposit}</span>}
                  {broker.spreadFrom && <span>Spread: {broker.spreadFrom}</span>}
                  {broker.maxLeverage && <span>Leverage: {broker.maxLeverage}</span>}
                  <div className="flex items-center gap-1 font-semibold" style={{ color: "#2bb32a" }}>
                    <Star className="h-4 w-4 fill-current" />
                    {Number(broker.rating || 0).toFixed(1)}
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
