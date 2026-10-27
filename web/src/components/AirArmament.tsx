import { Crosshair, Rocket, ShieldHalf } from "lucide-react";
import type { Armament, Loadout, WeaponCount } from "@/lib/data.gen";
import { roman } from "@/lib/nations";

const fmt = (n: number) => n.toLocaleString("en");
const items = (l: Loadout) => l.items.map((i) => `${i.count > 1 ? `${fmt(i.count)} × ` : ""}${i.name}`).join(" + ");
const byTier = (a: Loadout, b: Loadout) => (a.tier ?? 0) - (b.tier ?? 0) || items(a).localeCompare(items(b));

/** Guns, turrets and ordnance for aircraft and helicopters, from the game files. */
export function AirArmament({ a }: { a: Armament }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {(a.guns ?? []).length > 0 && <GunList title="Guns" icon={Crosshair} guns={a.guns!} />}
        {(a.turrets ?? []).length > 0 && <GunList title="Turrets" icon={ShieldHalf} guns={a.turrets!} />}
      </div>
      {a.countermeasures ? (
        <p className="text-sm text-fg-2">Countermeasures: {fmt(a.countermeasures)} flares and chaff.</p>
      ) : null}

      {(a.pylons ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fg">
            <Rocket className="h-4 w-4 text-fg-3" aria-hidden />
            Pylons
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {a.pylons!.map((p) => (
              <li key={p.index} className="panel">
                <p className="border-b border-card-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-fg-3">
                  Pylon {p.index}
                </p>
                <ul className="divide-y divide-card-border text-sm">
                  {[...p.options].sort(byTier).map((o, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                      <span className="text-fg">{items(o)}</span>
                      <Unlock tier={o.tier} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(a.presets ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-fg">
            <Rocket className="h-4 w-4 text-fg-3" aria-hidden />
            Loadouts
          </h3>
          <ul className="divide-y divide-card-border panel text-sm">
            {[...a.presets!].sort(byTier).map((o, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                <span className="text-fg">{items(o)}</span>
                <Unlock tier={o.tier} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-fg-3">
        From the game files. Pylon options and loadouts unlock with the modification tier shown; ones marked stock are
        available from the start.
      </p>
    </div>
  );
}

function GunList({ title, icon: Icon, guns }: { title: string; icon: typeof Crosshair; guns: WeaponCount[] }) {
  return (
    <div className="panel">
      <h3 className="flex items-center gap-2 border-b border-card-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-fg-3">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </h3>
      <ul className="divide-y divide-card-border text-sm">
        {guns.map((g) => (
          <li key={g.name} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
            <span className="text-fg">
              {g.count > 1 ? `${g.count} × ` : ""}
              {g.name}
            </span>
            {g.ammo ? <span className="tabular text-xs text-fg-3">{fmt(g.ammo)} rounds each</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Unlock({ tier }: { tier?: number | null }) {
  return <span className="shrink-0 text-xs text-fg-3">{tier ? `Tier ${roman(tier)}` : "Stock"}</span>;
}
