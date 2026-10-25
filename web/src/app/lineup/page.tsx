import type { Metadata } from "next";
import { CopyLink } from "@/components/CopyLink";
import { LineupTool } from "@/components/LineupTool";
import { BRANCHES, type Branch } from "@/lib/branches";
import { nationsOf } from "@/lib/data";

export const metadata: Metadata = {
  title: "Lineup and matchmaking",
  description:
    "Pick a nation and Battle Rating: see the vehicles you can bring and everything you can meet within War Thunder's ±1.0 matchmaking range.",
};

export default function LineupPage() {
  const nations = Object.fromEntries(BRANCHES.map((b) => [b, nationsOf(b)])) as Record<Branch, string[]>;
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Matchmaking</p>
        <h1 className="mt-1 text-4xl font-bold">Lineup planner</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Pick a nation and the Battle Rating you want to play. You can meet vehicles up to 1.0 above or below your
          highest BR. The link updates as you go, so you can share it.
        </p>
        <CopyLink className="mt-3" />
      </header>
      <LineupTool nations={nations} />
    </div>
  );
}
