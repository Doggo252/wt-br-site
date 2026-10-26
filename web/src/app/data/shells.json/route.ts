import { getIndex, getUnit } from "@/lib/data";

export const dynamic = "force-static";

/**
 * Anti-armour rounds of every current ground vehicle, for the shell comparison:
 * [unit id, shell, type, kind, pen 10 m, 500 m, 1000 m, 2000 m, velocity, tier, gun]
 * where kind is 0 kinetic, 1 HEAT jet, 2 HESH (the three pen columns then repeat the one figure),
 * tier is the research tier that unlocks it (0 = stock) and gun is the gun's name.
 */
export function GET() {
  const rows: (string | number)[][] = [];
  for (const s of getIndex()) {
    if (s.branch !== "ground" || s.removedIn) continue;
    const seen = new Set<string>();
    for (const g of getUnit(s.id).guns ?? []) {
      for (const o of g.ammo) {
        for (const r of o.rounds) {
          const flat = r.jet ?? r.hesh;
          if ((!r.pen && !flat) || seen.has(r.name)) continue;
          seen.add(r.name);
          const p = r.pen ?? [flat!, flat!, flat!, flat!, flat!, flat!];
          rows.push([s.id, r.name, r.type, r.jet ? 1 : r.hesh ? 2 : 0, p[0], p[2], p[3], p[5], r.speed ?? 0, o.tier ?? 0, g.name]);
        }
      }
    }
  }
  return Response.json(rows);
}
