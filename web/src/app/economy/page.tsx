import type { Metadata } from "next";
import { CopyLink } from "@/components/CopyLink";
import { EconomyBrowser } from "@/components/EconomyBrowser";
import { SectionTabs, TOOL_TABS } from "@/components/SectionTabs";

export const metadata: Metadata = {
  title: "Silver Lion calculator",
  description:
    "Which War Thunder vehicles make the most Silver Lions: reward multipliers, repair costs, break-even earnings and an estimate of net SL per battle.",
};

export default function EconomyPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Tools</p>
        <h1 className="mt-1 text-4xl font-bold">Silver Lion calculator</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Which vehicles pay, and which cost you money? Put in what you usually earn and how often you die, and every
          vehicle in range is ranked by what you&rsquo;d take home.
        </p>
        <CopyLink className="mt-3" />
      </header>
      <SectionTabs label="Tools" tabs={TOOL_TABS} current="/economy/" />
      <EconomyBrowser />
    </div>
  );
}
