import { getIndex, getPlannedRanks } from "@/lib/data";

export const dynamic = "force-static";

const STATUS = ["tree", "premium", "squadron", "event"] as const;

/**
 * Compact unit list for the lineup tool, current vehicles only:
 * [id, name, nation, branch, type, status index, hidden 0/1, ab, rb, sb, image 0/1, planned, price]
 * where planned is [ab, rb, sb] from Gaijin's newest announcement (null for modes it doesn't
 * change) while that change isn't live yet, else 0; price is the lowest Gaijin Market offer in GJN
 * (0 if not tradeable). Hidden vehicles that trade on the market count as obtainable.
 */
export function GET() {
  const planned = getPlannedRanks();
  const rows = getIndex()
    .filter((u) => !u.removedIn && u.branch !== "naval")
    .map((u) => [
      u.id,
      u.name,
      u.nation,
      u.branch,
      u.type,
      STATUS.indexOf(u.status),
      u.hidden && u.marketPrice == null ? 1 : 0,
      u.br.ab,
      u.br.rb,
      u.br.sb,
      u.image ? 1 : 0,
      planned.has(u.id) ? (["ab", "rb", "sb"] as const).map((m) => planned.get(u.id)![m] ?? null) : 0,
      u.marketPrice ?? 0,
    ]);
  return Response.json(rows);
}
