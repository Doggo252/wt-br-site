import type { Metadata } from "next";
import { SectionTabs, TOOL_TABS } from "@/components/SectionTabs";
import { HangarTool } from "@/components/HangarTool";

export const metadata: Metadata = {
  title: "My hangar",
  description:
    "Mark the War Thunder vehicles you own: see how close each rank is to opening, what to research next and your best lineups.",
};

export default function HangarPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Tools</p>
        <h1 className="mt-1 text-4xl font-bold">My hangar</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Click the vehicles you own. You&rsquo;ll see how many more you need to open the next rank, the cheapest
          research that&rsquo;s open to you, and the Battle Ratings where your lineup is strongest.
        </p>
      </header>
      <SectionTabs label="Tools" tabs={TOOL_TABS} current="/hangar/" />
      <HangarTool />
    </div>
  );
}
