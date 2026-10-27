import { getIndex, getResearchRules, getUnit } from "@/lib/data";

export const dynamic = "force-static";

const STATUS = ["tree", "premium", "squadron", "event"] as const;

/**
 * Research planner data: { unlocks: branch -> nation -> {rank: vehicles to own to open the next},
 * rows: [id, name, nation, branch, rank, ab, rb, sb, image 0/1, status index, requires, research RP,
 * purchase SL, crew SL] } for current vehicles you can have (hidden ones only when they're on the market).
 */
export function GET() {
  const rows = getIndex()
    .filter((s) => !s.removedIn && s.branch !== "naval" && (!s.hidden || s.marketPrice != null))
    .map((s) => {
      const e = getUnit(s.id).economy;
      return [
        s.id,
        s.name,
        s.nation,
        s.branch,
        s.rank,
        s.br.ab,
        s.br.rb,
        s.br.sb,
        s.image ? 1 : 0,
        STATUS.indexOf(s.status),
        s.requires ?? null,
        e?.researchRp ?? 0,
        e?.purchaseSl ?? 0,
        e?.crewSl ?? 0,
      ];
    });
  return Response.json({ unlocks: getResearchRules().unlocks, rows });
}
