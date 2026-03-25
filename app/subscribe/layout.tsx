import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscribe to Premium Signals | EntryLab",
  description: "Get priority XAU/USD trading signals, VIP Telegram access, weekly analysis, and 1-on-1 support.",
  alternates: { canonical: "https://entrylab.io/subscribe" },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
