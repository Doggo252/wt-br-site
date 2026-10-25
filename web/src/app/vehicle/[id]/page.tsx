import type { Metadata } from "next";
import Link from "@/components/Link";
import { BrStepChart } from "@/components/BrStepChart";
import { ChangeLog } from "@/components/ChangeLog";
import { Flag } from "@/components/Flag";
import { ChangeCell, OutcomeChip, rowOutcome } from "@/components/OfficialChanges";
import { SameBrStrip } from "@/components/SameBrStrip";
import { StarButton } from "@/components/StarButton";
import type { TreeUnit } from "@/components/TechTree";
import { ThermalChip } from "@/components/ThermalChip";
import { TreeLineStrip } from "@/components/TreeLineStrip";
import { UnitCard } from "@/components/UnitCard";
import { MODES, MODE_LABEL, MODE_NAME, formatBr, type Mode } from "@/lib/br";
import { getAnnouncementsByUnit, getDev, getIndex, getMeta, getTree, getUnit, getUnitMap } from "@/lib/data";
import type { Sight, UnitDetail, UnitSummary } from "@/lib/data.gen";
import { treeHref } from "@/lib/branches";
import { plainName, plural } from "@/lib/format";
import { TYPE_NAME, nationName, roman } from "@/lib/nations";
import { CREW_LABEL, type CrewRole, type Sight as ChipSight } from "@/lib/units";

export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().map((u) => ({ id: u.id }));
}

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const u = getUnit(id);
  return {
    title: `${plainName(u.name)} (${nationName(u.nation)}) BR history`,
    description: `${plainName(u.fullName)} (${nationName(u.nation)}): Battle Rating ${formatBr(u.br.ab)} AB / ${formatBr(u.br.rb)} RB / ${formatBr(u.br.sb)} SB, with stats and night vision.`,
    openGraph: u.image ? { images: [`/img/units/${id}.webp`] } : undefined,
  };
}

const STATUS_LABEL: Record<UnitDetail["status"], string> = {
  tree: "Tech tree",
  premium: "Premium",
  squadron: "Squadron",
  event: "Event",
};

const STATUS_CHIP: Record<UnitDetail["status"], string> = {
  tree: "border-[#3a4650] text-fg-2",
  premium: "border-premium/60 text-premium",
  squadron: "border-squadron/60 text-squadron",
  event: "border-premium/60 text-premium",
};

const CREWS: CrewRole[] = ["commander", "gunner", "driver"];

export default async function VehiclePage({ params }: Params) {
  const { id } = await params;
  const u = getUnit(id);
  const meta = getMeta();
  const same = sameBr(u, getIndex());
  const line = treeLine(u);
  const rivals = counterparts(u, getIndex());
  const dev = getDev();
  const devChange = dev?.changes?.find((c) => c.id === id);
  const devVersion = dev?.v;
  const announced = getAnnouncementsByUnit().get(id) ?? [];
  const plannedNow = announced.find(
    ({ a, change }) => a.kind === "planned" && Object.values(change.outcome ?? {}).includes("pending"),
  );
  const plannedForChart = plannedNow
    ? {
        date: plannedNow.a.date,
        ...Object.fromEntries(
          (["ab", "rb", "sb"] as const)
            .filter((m) => plannedNow.change.outcome?.[m] === "pending" && plannedNow.change[m])
            .map((m) => [m, plannedNow.change[m]![1]]),
        ),
      }
    : undefined;

  return (
    <article className="space-y-10">
      <header className="relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden border-b border-[#232b31] sm:-mt-10">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* The nation's flag, huge and faint, behind everything. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
          <img
            src={`/img/flags/${u.nation}.svg`}
            alt=""
            className="absolute -left-[8%] top-1/2 h-[160%] w-auto -translate-y-1/2 opacity-[0.06] blur-[2px] [mask-image:linear-gradient(90deg,black,transparent_70%)]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_70%_at_28%_55%,rgb(255_255_255/0.07),transparent_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[minmax(0,1.1fr)_1fr] md:items-center md:py-12">
          <div className="relative aspect-[2/1] w-full">
            {u.image && (
              // eslint-disable-next-line @next/next/no-img-element -- static export
              <img
                src={`/img/units/${id}.webp`}
                alt={u.name}
                className={`h-full w-full object-contain drop-shadow-[0_20px_24px_rgb(0_0_0/0.75)] ${u.removedIn ? "grayscale" : ""}`}
              />
            )}
            {/* Floor shadow. */}
            <div aria-hidden className="absolute inset-x-[12%] bottom-[6%] h-[10%] rounded-[50%] bg-black/50 blur-xl" />
          </div>
          <div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-3">
              <Link href={treeHref(u.branch, u.nation)} className="inline-flex items-center gap-1.5 text-fg-2 hover:text-fg">
                <Flag nation={u.nation} className="h-3.5" />
                {nationName(u.nation)}
              </Link>
              {u.operator && (
                <span className="inline-flex items-center gap-1.5">
                  · <Flag nation={u.operator} className="h-3" /> {nationName(u.operator)}
                </span>
              )}
              <span>· Rank {roman(u.rank)}</span>
              <span>· {TYPE_NAME[u.type]}</span>
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-none sm:text-5xl">{u.name}</h1>
            {u.fullName !== u.name && <p className="mt-2 text-fg-2">{u.fullName}</p>}
            <p className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className={`border px-2 py-0.5 font-display uppercase tracking-wider ${STATUS_CHIP[u.status]}`}>
                {STATUS_LABEL[u.status]}
              </span>
              {u.removedIn ? (
                <span className="border border-bad/50 px-2 py-0.5 font-display uppercase tracking-wider text-bad">
                  Removed in {u.removedIn}
                </span>
              ) : (
                u.hidden && (
                  <span className="border border-[#3a4650] px-2 py-0.5 font-display uppercase tracking-wider text-fg-3">
                    Not obtainable
                  </span>
                )
              )}
              {!u.removedIn && <StarButton id={u.id} name={plainName(u.name)} br={u.br} />}
            </p>
            <dl className="mt-6 grid max-w-md grid-cols-3 gap-2">
              {MODES.map((m) => (
                <div
                  key={m}
                  className="border border-[#2f3a42] bg-black/30 px-3 pb-2 pt-1.5 shadow-[inset_0_2px_0_var(--mode-color)]"
                  style={{ ["--mode-color" as string]: `var(--color-mode-${m})` }}
                >
                  <dt className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-3">
                    {MODE_NAME[m]}
                  </dt>
                  <dd className="font-display text-3xl font-bold tabular text-fg">{formatBr(u.br[m])}</dd>
                </div>
              ))}
            </dl>
            {u.groundBattleRb != null && (u.groundBattleRb !== u.br.rb || (u.groundBattleSb ?? u.br.sb) !== u.br.sb) && (
              <p className="mt-3 text-sm text-fg-2">
                In ground battles: RB <span className="font-display tabular text-fg">{formatBr(u.groundBattleRb)}</span>
                {u.groundBattleSb != null && (
                  <>
                    {" "}
                    · SB <span className="font-display tabular text-fg">{formatBr(u.groundBattleSb)}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </header>

      <nav aria-label="On this page" className="-mt-4 flex flex-wrap gap-2 text-sm">
        {[
          "Battle Rating history",
          u.branch === "ground" ? "Stats" : "Flight performance",
          announced.length > 0 && "Official announcements",
          line && "In the tech tree",
          rivals.length > 0 && "Counterparts",
          "Same Battle Rating",
        ]
          .filter((t): t is string => Boolean(t))
          .map((t) => (
            <a key={t} href={`#${slug(t)}`} className="btn px-2.5 py-1 text-xs">
              {t}
            </a>
          ))}
      </nav>

      {devChange && (
        <Link
          href="/dev/"
          className="callout-gold block px-4 py-3 text-sm hover:brightness-110"
        >
          <span className="eyebrow">Dev server {devVersion}</span>{" "}
          <span className="text-fg">
            {MODES.filter((m) => devChange.before[m] !== devChange.after[m])
              .map((m) => `${MODE_NAME[m]} ${formatBr(devChange.before[m])} → ${formatBr(devChange.after[m])}`)
              .join(", ")}
            . Not live yet.
          </span>
        </Link>
      )}

      {plannedNow && (
        <Link
          href={`/announcements/${plannedNow.a.id}/`}
          className="callout-gold block px-4 py-3 text-sm hover:brightness-110"
        >
          <span className="eyebrow">Planned by Gaijin</span>{" "}
          <span className="text-fg">
            {(["ab", "rb", "sb"] as const)
              .filter((m) => plannedNow.change.outcome?.[m] === "pending" && plannedNow.change[m])
              .map((m) => `${MODE_NAME[m]} ${formatBr(plannedNow.change[m]![0])} → ${formatBr(plannedNow.change[m]![1])}`)
              .join(", ")}
            . Announced {plannedNow.a.date}, not live yet.
          </span>
        </Link>
      )}

      <Section title="Battle Rating history">
        {u.history && u.history.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <HistorySummary u={u} />
              <Link href={`/compare/?ids=${u.id}`} className="text-sm">
                Compare with other vehicles →
              </Link>
            </div>
            <BrStepChart history={u.history} asOf={meta.date} planned={plannedForChart} />
            <ChangeLog history={u.history} absences={u.absences} added={u.added} />
          </div>
        ) : (
          <p className="panel p-5 text-sm text-fg-2">
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

      {announced.length > 0 && (
        <Section title="Official announcements">
          <ul className="divide-y divide-card-border panel text-sm">
            {announced.map(({ a, change }) => {
              const o = rowOutcome(change);
              return (
                <li key={`${a.id}-${change.name}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 py-2">
                  <span className="w-24 tabular text-fg-3">{a.date}</span>
                  <Link href={`/announcements/${a.id}/`} className="min-w-0 flex-1">
                    {a.title}
                  </Link>
                  <span className="flex flex-wrap gap-x-3 font-display tabular">
                    {(["ab", "rb", "sb", "grb"] as const)
                      .filter((m) => change[m])
                      .map((m) => (
                        <span key={m} className="inline-flex items-center gap-1">
                          <span className="text-xs text-fg-3">{m === "grb" ? "Ground RB" : MODE_LABEL[m]}</span>
                          <ChangeCell pair={change[m]} />
                        </span>
                      ))}
                  </span>
                  {o && <OutcomeChip outcome={o} />}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {line && (
        <Section title="In the tech tree">
          <nav aria-label="Tech tree line" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              {line.prev ? (
                <Link href={`/vehicle/${line.prev.id}/`} className="btn" rel="prev">
                  ← {line.prev.name}
                </Link>
              ) : (
                <span />
              )}
              <Link href={treeHref(u.branch, u.nation)} className="text-fg-2">
                Full {nationName(u.nation)} tree
              </Link>
              {line.next ? (
                <Link href={`/vehicle/${line.next.id}/`} className="btn" rel="next">
                  {line.next.name} →
                </Link>
              ) : (
                <span />
              )}
            </div>
            <TreeLineStrip
              current={u.id}
              units={line.units.map((o) => ({
                id: o.id,
                name: o.name,
                br: o.br,
                status: o.status,
                hidden: o.hidden,
                image: o.image,
                type: o.type,
              }))}
            />
          </nav>
        </Section>
      )}

      {rivals.length > 0 && (
        <Section title="Counterparts">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-fg-2">
              The closest {TYPE_NAME[u.type].toLowerCase()} by Realistic BR in each other nation.
            </p>
            <Link
              href={`/compare/?ids=${[u.id, ...rivals.slice(0, 4).map((o) => o.id)].join(",")}`}
              className="btn"
            >
              Compare BR history →
            </Link>
          </div>
          <ul className="flex snap-x gap-2 overflow-x-auto pb-3">
            {rivals.map((o) => (
              <li key={o.id} className="w-[140px] shrink-0 snap-start">
                <p className="mb-1 flex items-center gap-1.5 text-xs text-fg-3">
                  <Flag nation={o.nation} className="h-3" />
                  {nationName(o.nation)}
                </p>
                <UnitCard
                  name={o.name}
                  rank={o.br.rb}
                  status={o.status}
                  image={o.image ? `/img/units/${o.id}.webp` : undefined}
                  href={`/vehicle/${o.id}/`}
                  type={o.type}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

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
  const changes = u.changes ?? 0;
  parts.push(
    changes === 0 ? "Its BR has never changed." : `Its BR has changed in ${plural(changes, "update")}.`,
  );
  if (first && first.rb !== u.br.rb) {
    parts.push(`Realistic: ${formatBr(first.rb)} → ${formatBr(u.br.rb)} since ${u.added ? "release" : "2020"}.`);
  }
  if (u.removedIn) parts.push(`Removed in update ${u.removedIn}.`);
  return <p className="text-fg-2">{parts.join(" ")}</p>;
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={slug(title)} className="scroll-mt-20">
      <h2 className="section-title mb-4">{title}</h2>
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
    return <p className="panel px-3 py-3 text-sm text-fg-2">No night vision or thermal sights.</p>;
  }
  return (
    <div className="space-y-2">
      <dl className="panel divide-y divide-[#262f35]">
        {CREWS.map((crew) => {
          const ss = sights[crew] ?? [];
          return (
            <div key={crew} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <dt className="text-sm text-fg-3">{CREW_LABEL[crew]}</dt>
              <dd className="flex flex-wrap items-center justify-end gap-2">
                {ss.length === 0 ? (
                  <span className="text-sm text-fg-3">None</span>
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
    <>
      <dl className="divide-y divide-card-border panel">
        {rows
          .filter((r): r is [string, string] => r[1] !== null)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-3 py-1.5 text-sm">
              <dt className="text-fg-3">{k}</dt>
              <dd className="text-right font-display tabular text-fg">{v}</dd>
            </div>
          ))}
      </dl>
      <p className="mt-2 text-xs text-fg-3">Armor is front / side / rear. Speeds are forward / reverse.</p>
    </>
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
    <dl className="divide-y divide-card-border panel">
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
/** Per other nation, the obtainable vehicle of the same class closest in RB BR (tech tree first on ties). */
function counterparts(u: UnitDetail, index: UnitSummary[]): UnitSummary[] {
  if (u.type === "other") return [];
  const best = new Map<string, UnitSummary>();
  const score = (o: UnitSummary) => Math.abs(o.br.rb - u.br.rb) * 10 + (o.status === "tree" ? 0 : 1);
  for (const o of index) {
    if (o.nation === u.nation || o.type !== u.type || o.branch !== u.branch || o.hidden || o.removedIn) continue;
    if (Math.abs(o.br.rb - u.br.rb) > 3) continue;
    const cur = best.get(o.nation);
    if (!cur || score(o) < score(cur)) best.set(o.nation, o);
  }
  return [...best.values()].sort((a, b) => score(a) - score(b));
}

/** The tech tree column holding this vehicle, top to bottom, with its neighbours. */
function treeLine(u: UnitDetail) {
  if (u.removedIn || u.branch === "naval") return null;
  let tree;
  try {
    tree = getTree(u.branch, u.nation);
  } catch {
    return null;
  }
  const col = tree.columns.find((c) => c.some((cell) => cell.units.includes(u.id)));
  if (!col) return null;
  const map = getUnitMap();
  const units = col.flatMap((cell) => cell.units).flatMap((id) => map.get(id) ?? []);
  const i = units.findIndex((o) => o.id === u.id);
  if (units.length < 2) return null;
  // Up to seven cards, centred on this vehicle where the column allows.
  const start = Math.max(0, Math.min(i - 3, units.length - 7));
  return { units: units.slice(start, start + 7), prev: units[i - 1], next: units[i + 1] };
}

function sameBr(u: UnitDetail, index: UnitSummary[], limit = 30) {
  const byMode = {} as Record<Mode, string[]>;
  const units: Record<string, TreeUnit> = {};
  for (const m of MODES) {
    const peers = index
      .filter((o) => o.id !== u.id && o.branch === u.branch && o.br[m] === u.br[m] && !o.hidden && !o.removedIn)
      .sort((a, b) => Number(b.nation === u.nation) - Number(a.nation === u.nation) || a.name.localeCompare(b.name))
      .slice(0, limit);
    byMode[m] = peers.map((o) => o.id);
    for (const o of peers)
      units[o.id] = { name: o.name, status: o.status, hidden: o.hidden, br: o.br, image: o.image, type: o.type };
  }
  return { byMode, units };
}
