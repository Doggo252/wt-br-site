import type { Metadata } from "next";
import { SectionTabs, TOOL_TABS } from "@/components/SectionTabs";
import { WatchlistView } from "@/components/WatchlistView";

export const metadata: Metadata = {
  title: "Your watchlist",
  description: "Vehicles you starred, and how their Battle Rating moved since.",
  robots: { index: false },
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Saved in this browser</p>
        <h1 className="mt-1 text-4xl font-bold">Watchlist</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Star vehicles on their pages to keep them here. Each card shows how its BR moved since you starred it.
        </p>
      </header>
      <SectionTabs label="Tools" tabs={TOOL_TABS} current="/watchlist/" />
      <WatchlistView />
    </div>
  );
}
