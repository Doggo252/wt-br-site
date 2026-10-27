import { getIndex, getUnit } from "@/lib/data";

export const dynamic = "force-static";

const STATUS = ["tree", "premium", "squadron", "event"] as const;

/**
 * Economy of every current vehicle you can have:
 * [id, name, nation, branch, ab, rb, sb, image, status, SL multiplier % ab, rb, sb,
 *  repair SL ab, rb, sb (stock), repair SL ab, rb, sb (upgraded), RP multiplier %]
 */
export function GET() {
  const rows = getIndex()
    .filter((s) => !s.removedIn && s.branch !== "naval" && (!s.hidden || s.marketPrice != null))
    .flatMap((s) => {
      const e = getUnit(s.id).economy;
      if (!e) return [];
      return [
        [
          s.id,
          s.name,
          s.nation,
          s.branch,
          s.br.ab,
          s.br.rb,
          s.br.sb,
          s.image ? 1 : 0,
          STATUS.indexOf(s.status),
          e.rewardPct?.ab ?? 0,
          e.rewardPct?.rb ?? 0,
          e.rewardPct?.sb ?? 0,
          e.repairSl?.ab ?? 0,
          e.repairSl?.rb ?? 0,
          e.repairSl?.sb ?? 0,
          e.repairUpgradedSl?.ab ?? 0,
          e.repairUpgradedSl?.rb ?? 0,
          e.repairUpgradedSl?.sb ?? 0,
          e.rpPct ?? 0,
        ],
      ];
    });
  return Response.json(rows);
}
