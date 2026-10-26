import Link from "@/components/Link";
import type { AmmoOption, Gun, Round } from "@/lib/data.gen";
import { formatBr } from "@/lib/br";
import { roman } from "@/lib/nations";

/** Distances the ETL reports kinetic penetration at (etl/src/wtbr/ammo.py DISTANCES). */
export const PEN_DISTANCES = [10, 100, 500, 1000, 1500, 2000];

const fmt = (n: number) => n.toLocaleString("en");

/**
 * Every shell (or belt) each gun on a vehicle can load, with penetration by range. Figures are
 * the game's own: flat RHA at 0°, as the in-game ammo card shows them.
 */
/** `rank` is the vehicle's RB economic rank, for the link to the shell comparison. */
export function AmmoTable({ guns, rank }: { guns: Gun[]; rank?: number }) {
  return (
    <div className="space-y-6">
      {guns.map((g, gi) => {
        const best = Math.max(0, ...g.ammo.flatMap((o) => o.rounds.map(topPen)));
        return (
          <div key={gi} className="space-y-2">
            <h3 className="font-display text-base font-semibold text-fg">{g.name}</h3>
            <div className="panel overflow-x-auto">
              <table className="data-table w-full min-w-[760px] whitespace-nowrap text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 bg-panel">
                      Shell
                    </th>
                    <th scope="col">Type</th>
                    {PEN_DISTANCES.map((d) => (
                      <th key={d} scope="col" className="text-right">
                        {d >= 1000 ? `${d / 1000} km` : `${d} m`}
                      </th>
                    ))}
                    <th scope="col" className="text-right">
                      Velocity
                    </th>
                    <th scope="col" className="text-right">
                      Mass
                    </th>
                    <th scope="col" className="text-right">
                      Explosive
                    </th>
                    <th scope="col">Unlock</th>
                  </tr>
                </thead>
                <tbody>
                  {g.ammo.map((o, oi) =>
                    o.rounds.length > 1 ? (
                      <BeltRows key={oi} o={o} best={best} />
                    ) : (
                      <RoundRow key={oi} r={o.rounds[0]} o={o} best={best} />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-fg-3">
        Penetration in mm of rolled homogeneous armour at 0°, from the game files and matching the in-game ammo card.
        HEAT jets lose nothing over range; HESH shows the thickest plate it still damages behind; blast is what the
        explosion and fragments go through on contact.
        {rank != null && (
          <>
            {" "}
            <Link href={`/shells/?br=${formatBr(rank)}`}>Compare with every shell near this BR →</Link>
          </>
        )}
      </p>
    </div>
  );
}

function BeltRows({ o, best }: { o: AmmoOption; best: number }) {
  return (
    <>
      <tr>
        <td colSpan={13} className="!pb-0 text-xs font-display uppercase tracking-wider text-fg-3">
          Belt: {o.rounds.map((r) => r.type).join(" · ")}
          <span className="ml-2 normal-case tracking-normal">{unlock(o)}</span>
        </td>
      </tr>
      {o.rounds.map((r, i) => (
        <RoundRow key={i} r={r} best={best} indent />
      ))}
    </>
  );
}

function RoundRow({ r, o, best, indent = false }: { r: Round; o?: AmmoOption; best: number; indent?: boolean }) {
  return (
    <tr>
      <th
        scope="row"
        className={`sticky left-0 z-10 bg-panel text-left font-display font-normal text-fg ${indent ? "!pl-6" : ""}`}
      >
        {r.name}
      </th>
      <td className="text-fg-2" title={r.typeName ?? undefined}>
        {r.type}
      </td>
      <PenCells r={r} best={best} />
      <td className="text-right tabular text-fg-2">{r.speed ? `${fmt(r.speed)} m/s` : "—"}</td>
      <td className="text-right tabular text-fg-2">{r.mass ? `${r.mass} kg` : "—"}</td>
      <td className="text-right tabular text-fg-2">
        {r.tnt ? (
          <>
            {r.tnt} kg TNT
            {r.frag ? <span className="block text-xs text-fg-3">blast {r.frag} mm</span> : null}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="whitespace-nowrap text-xs text-fg-3">{o ? unlock(o) : null}</td>
    </tr>
  );
}

function PenCells({ r, best }: { r: Round; best: number }) {
  const span = PEN_DISTANCES.length;
  if (r.jet || r.hesh) {
    const v = (r.jet ?? r.hesh)!;
    return (
      <td colSpan={span} className={`text-center tabular ${v === best ? "font-semibold text-gold" : "text-fg"}`}>
        {fmt(v)} mm {r.jet ? "jet, any range" : "HESH"}
        {r.range ? <span className="text-fg-3"> · {fmt(r.range)} m range</span> : null}
        {r.guidance ? <span className="text-fg-3"> · {r.guidance.toUpperCase()}</span> : null}
      </td>
    );
  }
  if (!r.pen) {
    return (
      <td colSpan={span} className="text-center text-fg-3">
        —
      </td>
    );
  }
  return r.pen.map((p, i) => (
    <td
      key={i}
      className={`text-right tabular ${i === 0 && p === best ? "font-semibold text-gold" : i === 0 ? "text-fg" : "text-fg-2"}`}
    >
      {p}
    </td>
  ));
}

function topPen(r: Round): number {
  return Math.max(r.pen?.[0] ?? 0, r.jet ?? 0, r.hesh ?? 0);
}

function unlock(o: AmmoOption): string {
  const parts = [o.tier ? `Tier ${roman(o.tier)}${o.rp ? ` · ${fmt(o.rp)} RP` : ""}` : "Stock"];
  if (o.perShell) parts.push(`${fmt(o.perShell)} SL each`);
  return parts.join(" · ");
}
