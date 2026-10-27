import type { Metadata } from "next";
import { SectionTabs, TOOL_TABS } from "@/components/SectionTabs";
import { CopyLink } from "@/components/CopyLink";
import { ResearchPlanner } from "@/components/ResearchPlanner";

export const metadata: Metadata = {
  title: "Research planner",
  description:
    "Pick a War Thunder vehicle and see every vehicle you need to research to get there, with research points, Silver Lions and an estimate of battles.",
};

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Tools</p>
        <h1 className="mt-1 text-4xl font-bold">Research planner</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          How far is that vehicle? Pick it and see the path through the tech tree, what it costs, and roughly how many
          battles it takes. Tick off what you already own and the plan shrinks.
        </p>
        <CopyLink className="mt-3" />
      </header>
      <SectionTabs label="Tools" tabs={TOOL_TABS} current="/research/" />
      <ResearchPlanner />
    </div>
  );
}
