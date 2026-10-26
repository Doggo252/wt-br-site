import type { Metadata } from "next";
import { RANKING_TABS, SectionTabs } from "@/components/SectionTabs";
import { CopyLink } from "@/components/CopyLink";
import { ShellBrowser } from "@/components/ShellBrowser";

export const metadata: Metadata = {
  title: "Shell penetration",
  description:
    "Every War Thunder tank shell ranked by armour penetration at 10 m to 2 km, filtered by Battle Rating, nation and shell type.",
};

export default function ShellsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Ammunition</p>
        <h1 className="mt-1 text-4xl font-bold">Shell penetration</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Every anti-armour shell on every ground vehicle, ranked. Pick a Battle Rating to see what you&rsquo;ll be
          shooting with, and what you&rsquo;ll be shot with, inside the matchmaking range.
        </p>
        <CopyLink className="mt-3" />
      </header>
      <SectionTabs label="Rankings" tabs={RANKING_TABS} current="/shells/" />
      <ShellBrowser />
    </div>
  );
}
