import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Subscription | EntryLab",
  description: "Check your premium signals subscription status and access your VIP Telegram group.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
