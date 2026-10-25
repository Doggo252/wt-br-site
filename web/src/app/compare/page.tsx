import type { Metadata } from "next";
import { CompareTool } from "@/components/CompareTool";
import { getUnitMap } from "@/lib/data";

// Starting points for an empty comparison; groups with a missing id are dropped at build time.
const SUGGESTIONS: { label: string; ids: string[] }[] = [
  { label: "Tiger H1 vs IS-2 vs Panther", ids: ["germ_pzkpfw_VI_ausf_h1_tiger", "ussr_is_2_1944", "germ_pzkpfw_V_ausf_a_panther"] },
  { label: "Sherman family", ids: ["us_m4a3e8_76w_sherman", "uk_sherman_vc_firefly", "ussr_t_34_85_zis_53"] },
  { label: "Top-tier MBTs", ids: ["us_m1a2_sep_abrams", "germ_leopard_2a6", "uk_challenger_2_tes"] },
  { label: "Anti-air: M42 vs ZSU-37", ids: ["us_m42_duster", "ussr_zsu_37"] },
  { label: "P-51D-5 vs Bf 109 F-4 vs Yak-3", ids: ["p-51d-5", "bf-109f-4", "yak-3"] },
  { label: "AH-64A vs Mi-24P", ids: ["ah_64a", "mi_24p"] },
];

export const metadata: Metadata = {
  title: "Compare BR history",
  description: "Compare the Battle Rating history of up to five War Thunder vehicles on one chart.",
};

export default function ComparePage() {
  const units = getUnitMap();
  const suggestions = SUGGESTIONS.filter((g) => g.ids.every((id) => units.has(id)));
  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Side by side</p>
        <h1 className="mt-1 text-4xl font-bold">Compare</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Put up to five vehicles, aircraft or helicopters on one BR chart. The link updates as you go, so you can
          share it.
        </p>
      </header>
      <CompareTool suggestions={suggestions} />
    </div>
  );
}
