import { getIndex, getUnit } from "@/lib/data";
import { METRICS } from "@/lib/rankings";

export const dynamic = "force-static";

const STATUS = ["tree", "premium", "squadron", "event"] as const;

/**
 * Leaderboard data, current obtainable vehicles only:
 * { metrics: keys in column order, rows: [id, name, nation, branch, ab, rb, sb, image 0/1, status index, ...values] }
 * where each value is the metric (lib/rankings.ts) or null.
 */
export function GET() {
  const rows = getIndex()
    .filter((s) => !s.removedIn && s.branch !== "naval" && (!s.hidden || s.marketPrice != null))
    .map((s) => {
      const u = getUnit(s.id);
      return [
        s.id,
        s.name,
        s.nation,
        s.branch,
        s.br.ab,
        s.br.rb,
        s.br.sb,
        s.image ? 1 : 0,
        STATUS.indexOf(s.status),
        ...METRICS.map((m) => (m.branches.includes(s.branch as "ground") ? (m.get(u) ?? null) : null)),
      ];
    });
  return Response.json({ metrics: METRICS.map((m) => m.key), rows });
}
