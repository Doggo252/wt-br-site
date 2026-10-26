import type { Metadata } from "next";
import { RANKING_TABS, SectionTabs } from "@/components/SectionTabs";
import { CopyLink } from "@/components/CopyLink";
import { RankingsBoard } from "@/components/RankingsBoard";

export const metadata: Metadata = {
  title: "Rankings",
  description:
    "War Thunder leaderboards: fastest and heaviest tanks, most penetration, fastest reload, best gun depression, fastest aircraft, best climb and turn, by Battle Rating and nation.",
};

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Leaderboards</p>
        <h1 className="mt-1 text-4xl font-bold">Rankings</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          The top ten in every category, from the game files. Narrow it to a Battle Rating to find, say, the fastest
          tank you can take at 6.7, or the best-climbing fighter in your nation.
        </p>
        <CopyLink className="mt-3" />
      </header>
      <SectionTabs label="Rankings" tabs={RANKING_TABS} current="/rankings/" />
      <RankingsBoard />
      <p className="text-xs text-fg-3">
        Stock vehicles with an aced crew where the game says so: speeds and engine power are the in-game card figures,
        armour is the nominal front plate, penetration is the best shell at 10 m. Event vehicles count while they are
        on the Gaijin Market.
      </p>
    </div>
  );
}
