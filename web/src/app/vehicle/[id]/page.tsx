import type { Metadata } from "next";
import Link from "next/link";
import { BrBadge } from "@/components/BrBadge";
import { BrStepChart } from "@/components/BrStepChart";
import { ChangeLog } from "@/components/ChangeLog";
import { SameBrStrip } from "@/components/SameBrStrip";
import type { TreeUnit } from "@/components/TechTree";
import { ThermalChip } from "@/components/ThermalChip";
import { MODES, MODE_NAME, formatBr, type Mode } from "@/lib/br";
import { getDev, getIndex, getMeta, getUnit } from "@/lib/data";
import type { Sight, UnitDetail, UnitSummary } from "@/lib/data.gen";
import { treeHref } from "@/lib/branches";
import { TYPE_NAME, nationName, roman } from "@/lib/nations";
import type { CrewRole, Sight as ChipSight } from "@/lib/units";

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().map((u) => ({ id: u.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const u = getUnit(id);
  return {
    title: `${u.name} BR history`,
    description: `${u.fullName} (${nationName(u.nation)}): Battle Rating ${formatBr(u.br.ab)} AB / ${formatBr(u.br.rb)} RB / ${formatBr(u.br.sb)} SB, with stats and night vision.`,
    openGraph: u.image ? { images: [`/img/units/${id}.webp`] } : undefined,
  };
}

const STATUS_LABEL: Record<UnitDetail["status"], string> = {
  tree: "Tech tree",
  premium: "Premium",
  squadron: "Squadron",
  event: "Event",
};

const STATUS_COLOR: Record<UnitDetail["status"], string> = {
  tree: "text-fg-2",
  premium: "text-premium",
  squadron: "text-squadron",
  event: "text-premium",
};

const CREWS: CrewRole[] = ["commander", "gunner", "driver"];

export default async function VehiclePage({ params }: Params) {
  const { id } = await params;
  const u = getUnit(id);
  const meta = getMeta();
  const same = sameBr(u, getIndex());
  const dev = getDev();
  const devChange = dev?.changes?.find((c) => c.id === id);
  const devVersion = dev?.v;

  return (
    <article className="space-y-10">
      <header className="grid gap-6 md:grid-cols-[minmax(0,512px)_1fr] md:items-center">
        <div className="relative aspect-[2/1] w-full border border-card-border bg-panel">
          {u.image && (
            // eslint-disable-next-line @next/next/no-img-element -- static export
            <img src={`/img/units/${id}.webp`} alt={u.name} className="h-full w-full object-contain" />
          )}
        </div>
        <div>
          <p className="text-sm text-fg-3">
            <Link href={treeHref(u.branch, u.nation)} className="text-fg-2 no-underline hover:text-fg">
              {nationName(u.nation)}
            </Link>
            {u.operator && <> · {nationName(u.operator)}</>} · Rank {roman(u.rank)} · {TYPE_NAME[u.type]}
          </p>
          <h1 className="mt-1 text-4xl font-bold leading-tight">{u.name}</h1>
          {u.fullName !== u.name && <p className="mt-1 text-fg-2">{u.fullName}</p>}
          <p className="mt-2 text-sm">
            <span className={STATUS_COLOR[u.status]}>{STATUS_LABEL[u.status]}</span>
            {u.removedIn ? (
              <span className="text-bad"> · removed in update {u.removedIn}</span>
            ) : (
              u.hidden && <span className="text-fg-3"> · not currently obtainable</span>
            )}
          </p>
          <dl className="mt-5 grid max-w-sm grid-cols-3 border border-card-border bg-panel">
            {MODES.map((m) => (
              <div key={m} className="border-r border-card-border px-3 py-2 last:border-r-0">
                <dt className="text-xs text-fg-3">{MODE_NAME[m]}</dt>
                <dd>
                  <BrBadge rank={u.br[m]} size="lg" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {devChange && (
        <Link
          href="/dev/"
          className="block border border-card-premium-border bg-card-premium-bg px-4 py-3 text-sm no-underline hover:brightness-110"
        >
          <span className="font-display uppercase tracking-wide text-gold">Dev server {devVersion}</span>{" "}
          <span className="text-fg">
            {MODES.filter((m) => devChange.before[m] !== devChange.after[m])
              .map((m) => `${MODE_NAME[m]} ${formatBr(devChange.before[m])} → ${formatBr(devChange.after[m])}`)
              .join(", ")}
            . Not live yet.
          </span>
        </Link>
      )}

      <Section title="Battle Rating history">
        {u.history && u.history.length > 0 ? (
          <div className="space-y-4">
            <HistorySummary u={u} />
            <BrStepChart history={u.history} asOf={meta.date} />
            <ChangeLog history={u.history} absences={u.absences} added={u.added} />
          </div>
        ) : (
          <p className="border border-dashed border-card-border bg-panel p-5 text-sm text-fg-2">
            No history recorded for this vehicle yet.
          </p>
        )}
      </Section>

      <div className="grid gap-10 md:grid-cols-2">
        {u.branch === "ground" ? (
          <Section title="Night vision">
            <NightVision sights={u.sights ?? {}} />
          </Section>
        ) : null}
        <div className="space-y-10">
          <Section title={u.branch === "ground" ? "Stats" : "Flight performance"}>
            <StatGrid u={u} />
            {u.branch !== "ground" && (
              <p className="mt-2 text-xs text-fg-3">From the in-game stat card, stock (unupgraded).</p>
            )}
          </Section>
          {u.record && (
            <Section title="RB kill record">
              <RecordCard record={u.record} />
            </Section>
          )}
        </div>
      </div>

      <Section title="Same Battle Rating">
        <SameBrStrip byMode={same.byMode} units={same.units} rank={u.br} />
      </Section>

      <p className="text-xs text-fg-3">
        Data from the War Thunder Datamine, update <span className="tabular">{meta.version}</span>. Vehicle id{" "}
        <code>{u.id}</code>.
      </p>
    </article>
  );
}

function RecordCard({ record }: { record: NonNullable<UnitDetail["record"]> }) {
  return (
    <div className="flex items-center gap-4 border border-card-premium-border bg-card-premium-bg p-4">
      <span className="font-display text-4xl font-bold tabular text-gold">{record.kills}</span>
      <div className="text-sm">
        <p className="text-fg">kills in one life</p>
        <p className="text-fg-2">
          {record.player && <>by {record.player}</>}
          {record.patch && <> · update {record.patch}</>}
        </p>
        <p className="mt-1 text-xs text-fg-3">
          From the community <Link href="/records/">Ground RB Records</Link> sheet.
        </p>
      </div>
    </div>
  );
}

function HistorySummary({ u }: { u: UnitDetail }) {
  const h = u.history ?? [];
  const first = h[0];
  const parts: string[] = [];
  parts.push(u.added ? `Added in update ${u.added}.` : `In the game since before March 2020.`);
  parts.push(
    u.changes === 0
      ? "Its BR has never changed."
      : `Its BR has changed in ${u.changes} update${u.changes === 1 ? "" : "s"}.`,
  );
  if (first && first.rb !== u.br.rb) {
    parts.push(`Realistic: ${formatBr(first.rb)} → ${formatBr(u.br.rb)} since ${u.added ? "release" : "2020"}.`);
  }
  if (u.removedIn) parts.push(`Removed in update ${u.removedIn}.`);
  return <p className="text-fg-2">{parts.join(" ")}</p>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function toChip(s: Sight): ChipSight {
  if (s.kind === "ir") return { kind: "nv" };
  return {
    kind: "thermal",
    gen: s.gen === 1 || s.gen === 2 || s.gen === 3 ? s.gen : undefined,
    resolution: s.resolution,
  };
}

function NightVision({ sights }: { sights: Record<string, Sight[]> }) {
  const anyMod = Object.values(sights).some((ss) => ss.some((s) => s.viaModification));
  if (Object.keys(sights).length === 0) {
    return <p className="text-sm text-fg-2">No night vision or thermal sights.</p>;
  }
  return (
    <div className="space-y-3">
      <dl className="space-y-2">
        {CREWS.map((crew) => {
          const ss = sights[crew] ?? [];
          return (
            <div key={crew} className="flex flex-wrap items-center gap-2">
              <dt className="sr-only">{crew}</dt>
              <dd className="flex flex-wrap items-center gap-2">
                {ss.length === 0 ? (
                  <ThermalChip crew={crew} sight={{ kind: "none" }} />
                ) : (
                  ss.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <ThermalChip crew={crew} sight={toChip(s)} />
                      {s.viaModification && (
                        <span className="text-xs text-fg-3" title="Needs a researched modification">
                          mod
                        </span>
                      )}
                    </span>
                  ))
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {anyMod && <p className="text-xs text-fg-3">“mod” sights need the night vision modification researched.</p>}
    </div>
  );
}

function StatGrid({ u }: { u: UnitDetail }) {
  const s = u.stats ?? {};
  if (u.branch !== "ground") return <AirStatGrid u={u} />;
  const rows: [string, string | null][] = [
    ["Main gun", s.mainGun ?? null],
    ["Reload", s.reloadS != null ? `${s.reloadS.toFixed(1)} s` : null],
    ["Crew", s.crew != null ? String(s.crew) : null],
    ["Mass", s.massT != null ? `${s.massT.toFixed(1)} t` : null],
    ["Engine", s.enginePowerHp != null ? `${Math.round(s.enginePowerHp)} hp` : null],
    ["Power-to-weight", s.powerToWeight != null ? `${s.powerToWeight.toFixed(1)} hp/t` : null],
    [
      "Max speed",
      s.maxSpeedFwd != null ? `${Math.round(s.maxSpeedFwd)} / ${Math.round(s.maxSpeedRev ?? 0)} km/h` : null,
    ],
    ["Hull armor", s.armorHull ? `${s.armorHull.map((x) => Math.round(x)).join(" / ")} mm` : null],
    ["Turret armor", s.armorTurret ? `${s.armorTurret.map((x) => Math.round(x)).join(" / ")} mm` : null],
  ];
  return (
    <dl className="divide-y divide-card-border border border-card-border bg-panel">
      {rows
        .filter((r): r is [string, string] => r[1] !== null)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-1.5 text-sm">
            <dt className="text-fg-3">{k}</dt>
            <dd className="text-right font-display tabular text-fg">{v}</dd>
          </div>
        ))}
      <p className="px-3 py-1.5 text-xs text-fg-3">Armor is front / side / rear. Speeds are forward / reverse.</p>
    </dl>
  );
}

function AirStatGrid({ u }: { u: UnitDetail }) {
  const s = u.stats ?? {};
  const n = (v: number | null | undefined, unit: string, digits = 0) =>
    v != null ? `${v.toLocaleString("en", { maximumFractionDigits: digits })} ${unit}` : null;
  const rows: [string, string | null][] = [
    ["Max speed", s.maxSpeedKmh != null ? `${n(s.maxSpeedKmh, "km/h")}${s.maxSpeedAltM ? ` at ${n(s.maxSpeedAltM, "m")}` : ""}` : null],
    ["Climb rate", n(s.climbRate, "m/s", 1)],
    ["Turn time", n(s.turnTimeS, "s", 1)],
    ["Roll rate", n(s.rollRate, "°/s")],
    ["Ceiling", n(s.ceilingM, "m")],
    ["Crew", s.crew != null ? String(s.crew) : null],
  ];
  return (
    <dl className="divide-y divide-card-border border border-card-border bg-panel">
      {rows
        .filter((r): r is [string, string] => r[1] !== null)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-1.5 text-sm">
            <dt className="text-fg-3">{k}</dt>
            <dd className="text-right font-display tabular text-fg">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Vehicles of the same branch at exactly the same BR in each mode: same nation first, then others. */
function sameBr(u: UnitDetail, index: UnitSummary[], limit = 30) {
  const byMode = {} as Record<Mode, string[]>;
  const units: Record<string, TreeUnit> = {};
  for (const m of MODES) {
    const peers = index
      .filter((o) => o.id !== u.id && o.branch === u.branch && o.br[m] === u.br[m] && !o.hidden && !o.removedIn)
      .sort((a, b) => Number(b.nation === u.nation) - Number(a.nation === u.nation) || a.name.localeCompare(b.name))
      .slice(0, limit);
    byMode[m] = peers.map((o) => o.id);
    for (const o of peers) units[o.id] = { name: o.name, status: o.status, hidden: o.hidden, br: o.br, image: o.image };
  }
  return { byMode, units };
}
