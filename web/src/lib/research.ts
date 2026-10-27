/** app/data/planner.json/route.ts */
export type PlanRow = [
  id: string,
  name: string,
  nation: string,
  branch: string,
  rank: number,
  ab: number,
  rb: number,
  sb: number,
  image: 0 | 1,
  status: number, // 0 tree, 1 premium, 2 squadron, 3 event
  requires: string | null,
  rp: number,
  sl: number,
  crewSl: number,
];

/** `forRank`: an extra vehicle to open that rank; `via`: a prerequisite of that extra vehicle. */
export type Step = { id: string; forRank: number | null; via: string | null };

/**
 * What to research, in order, to reach `target`: its missing prerequisites, plus, where a rank
 * needs more vehicles of the rank before it than you own or will research on the way, the
 * cheapest extra ones (counting their own prerequisites). `unlocks` is rank -> vehicles of that
 * rank needed to open the next one, for the target's nation and branch.
 */
export function plan(
  rows: Map<string, PlanRow>,
  unlocks: Record<string, number>,
  target: string,
  owned: Set<string>,
): Step[] {
  const t = rows.get(target);
  if (!t) return [];
  const steps = new Map<string, Step>();
  const missing = (id: string | null) => {
    const chain: string[] = [];
    for (let u = id; u && rows.has(u) && !owned.has(u) && !steps.has(u); u = rows.get(u)![10]) chain.push(u);
    return chain.reverse();
  };
  const add = (id: string, forRank: number | null) => {
    for (const u of missing(id)) {
      steps.set(u, { id: u, forRank: u === id ? forRank : null, via: u === id || !forRank ? null : id });
    }
  };
  add(target, null);

  const peers = [...rows.values()].filter((r) => r[2] === t[2] && r[3] === t[3]);
  for (let rank = t[4] - 1; rank >= 1; rank--) {
    const need = unlocks[rank] ?? 0;
    const have = () => peers.filter((r) => r[4] === rank && (owned.has(r[0]) || steps.has(r[0]))).length;
    while (have() < need) {
      let best: string | null = null;
      let bestCost = Infinity;
      for (const r of peers) {
        if (r[4] !== rank || r[9] !== 0 || owned.has(r[0]) || steps.has(r[0])) continue;
        const cost = missing(r[0]).reduce((n, u) => n + rows.get(u)![11], 0);
        if (cost < bestCost) {
          best = r[0];
          bestCost = cost;
        }
      }
      if (!best) break;
      add(best, rank + 1);
    }
  }
  return [...steps.values()].sort(
    (a, b) => rows.get(a.id)![4] - rows.get(b.id)![4] || rows.get(a.id)![6] - rows.get(b.id)![6],
  );
}
