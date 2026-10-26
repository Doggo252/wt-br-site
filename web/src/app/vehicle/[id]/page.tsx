import type { Metadata } from "next";
import {
  Binoculars,
  Car,
  Cog,
  Crosshair,
  Gauge,
  type LucideIcon,
  Mountain,
  Repeat,
  RotateCw,
  Shield,
  ShieldHalf,
  Store,
  ShoppingCart,
  Package,
  MoveHorizontal,
  MoveVertical,
  Settings2,
  Coins,
  Wrench,
  GraduationCap,
  BookOpen,
  Paintbrush,
  TimerReset,
  TrendingUp,
  Users,
  Weight,
  Zap,
} from "lucide-react";
import Link from "@/components/Link";
import { AmmoTable } from "@/components/AmmoTable";
import { BrStepChart } from "@/components/BrStepChart";
import { BranchIcon } from "@/components/BranchIcon";
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
import { getAnnouncementsByUnit, getDev, getIndex, getMarket, getMeta, getTree, getUnit, getUnitMap } from "@/lib/data";
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
    title: `${plainName(u.name)} (${titleQualifier(u)}) BR history`,
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
  const marketDate = getMarket()?.snapshot;
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
            {!u.image && u.branch !== "naval" && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-fg/10">
                <BranchIcon branch={u.branch} className="h-2/3 w-2/3" />
                <p className="text-xs text-fg-3">No picture of this vehicle in the game files</p>
              </div>
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
              {!u.removedIn && (
                <a
                  href={`https://wiki.warthunder.com/unit/${u.id}`}
                  rel="noopener"
                  target="_blank"
                  className="btn gap-1.5 px-2 py-0.5 text-xs uppercase tracking-wider"
                  title="This vehicle's article on the official War Thunder Wiki: history, usage guide, pros and cons"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  Wiki
                </a>
              )}
              {u.marketName && (
                <a
                  href={marketHref(u.marketName)}
                  rel="noopener"
                  target="_blank"
                  className="btn gap-1.5 px-2 py-0.5 text-xs uppercase tracking-wider"
                  title="Trade this vehicle on the Gaijin Market (needs a Gaijin login)"
                >
                  <Store className="h-3.5 w-3.5" aria-hidden />
                  Gaijin Market
                  {u.market?.price != null && <span className="tabular normal-case text-gold">{gjn(u.market.price)}</span>}
                </a>
              )}
              {(u.storePacks ?? []).map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  rel="noopener"
                  target="_blank"
                  className="btn gap-1.5 px-2 py-0.5 text-xs uppercase tracking-wider"
                  title={`${p.title} on the Gaijin Store`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                  {(u.storePacks ?? []).length > 1 ? p.title : "Gaijin Store"}
                  <span className="tabular normal-case text-gold">
                    {p.oldPrice != null && (
                      <s className="mr-1 text-fg-3">
                        {p.currency ?? "$"}
                        {p.oldPrice}
                      </s>
                    )}
                    {p.currency ?? "$"}
                    {p.price}
                  </span>
                </a>
              ))}
              {u.geCost != null && !u.hidden && (
                <span
                  className="inline-flex items-center gap-1.5 border border-card-border px-2 py-0.5 font-display text-xs uppercase tracking-wider text-fg-2"
                  title="Price in Golden Eagles in the in-game shop"
                >
                  <Coins className="h-3.5 w-3.5" aria-hidden />
                  In game <span className="tabular normal-case text-gold">{u.geCost.toLocaleString("en")} GE</span>
                </span>
              )}
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
          u.branch === "ground" ? "Stats" : "Flight performance",
          u.economy && "Economy and crew",
          u.branch === "ground" && "Night vision",
          u.record && "RB kill record",
          "Battle Rating history",
          (u.guns ?? []).length > 0 && "Ammunition",
          announced.length > 0 && "Official announcements",
          line && "In the tech tree",
          rivals.length > 0 && "Counterparts",
          (u.market || (u.skins ?? []).length > 0) && "Gaijin Market",
          (u.modifications ?? []).length > 0 && "Modifications",
          (u.patchNotes ?? []).length > 0 && "Patch notes",
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


      <Section title={u.branch === "ground" ? "Stats" : "Flight performance"}>
        <StatGrid u={u} />
        {u.branch !== "ground" && (
          <p className="mt-2 text-xs text-fg-3">From the in-game stat card, stock (unupgraded).</p>
        )}
      </Section>

      {u.economy && (
        <Section title="Economy and crew">
          <EconomyBlock u={u} />
        </Section>
      )}

      {(u.branch === "ground" || u.record) && (
        <div className="grid gap-10 md:grid-cols-2">
          {u.branch === "ground" && (
            <Section title="Night vision">
              <NightVision sights={u.sights ?? {}} />
            </Section>
          )}
          {u.record && (
            <Section title="RB kill record">
              <RecordCard record={u.record} />
            </Section>
          )}
        </div>
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
            <ChangeLog history={u.history} absences={u.absences} added={u.added} from={u.id} />
          </div>
        ) : (
          <p className="panel p-5 text-sm text-fg-2">
            No history recorded for this vehicle yet.
          </p>
        )}
      </Section>

      {(u.guns ?? []).length > 0 && (
        <Section title="Ammunition">
          <AmmoTable guns={u.guns!} rank={u.removedIn ? undefined : u.br.rb} />
        </Section>
      )}

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

      {(u.market || (u.skins ?? []).length > 0) && (
        <Section title="Gaijin Market">
          <MarketSection u={u} asOf={marketDate} />
        </Section>
      )}

      {(u.modifications ?? []).length > 0 && (
        <Section title="Modifications">
          <ModificationList mods={u.modifications!} />
        </Section>
      )}

      {(u.patchNotes ?? []).length > 0 && (
        <Section title="Patch notes">
          <ul className="patch-notes divide-y divide-card-border panel text-sm">
            {u.patchNotes!.map((m, i) => (
              <li key={`${m.id}-${i}`} className="px-3 py-2.5">
                <p className="mb-1 flex flex-wrap items-baseline gap-x-3 text-xs text-fg-3">
                  <span className="tabular">{m.date}</span>
                  <Link href={`/patch-notes/${m.id}/`} className="text-fg-2 hover:text-link">
                    {m.title}
                  </Link>
                </p>
                <span className="text-fg-2" dangerouslySetInnerHTML={{ __html: m.html }} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-fg-3">Changes that name this vehicle in the official changelog, newest first.</p>
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

const CREW_ICON: Record<CrewRole, LucideIcon> = { commander: Binoculars, gunner: Crosshair, driver: Car };

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
          const Icon = CREW_ICON[crew];
          return (
            <div key={crew} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <dt className="inline-flex items-center gap-2 text-sm text-fg-3">
                <Icon className="h-4 w-4 text-gold/80" aria-hidden />
                {CREW_LABEL[crew]}
              </dt>
              <dd className="flex flex-wrap items-center justify-end gap-2">
                {ss.length === 0 ? (
                  <span className="text-sm text-fg-3">None</span>
                ) : (
                  ss.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <ThermalChip crew={crew} sight={toChip(s)} />
                      <span className="font-display text-xs tabular text-fg-2">
                        {s.resolution[0]}×{s.resolution[1]}
                      </span>
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

type StatRow = [LucideIcon, string, string | null];

function StatGrid({ u }: { u: UnitDetail }) {
  const s = u.stats ?? {};
  if (u.branch !== "ground") return <AirStatGrid u={u} />;
  const rows: StatRow[] = [
    [Crosshair, "Main gun", s.mainGun ?? null],
    // Game files hold the aced-crew reload; a basic crew takes 30% longer (the wiki's "basic → aced").
    [TimerReset, "Reload", s.reloadS != null ? `${(s.reloadS * 1.3).toFixed(1)} → ${s.reloadS.toFixed(1)} s` : null],
    [Package, "Ammo", s.ammo != null ? `${s.ammo} rounds` : null],
    [
      MoveHorizontal,
      "Turret traverse",
      s.traverseDegS != null
        ? `${s.traverseDegS.toFixed(1)}°/s${s.traverseLimits ? ` (${s.traverseLimits[0]}° to +${s.traverseLimits[1]}°)` : ""}`
        : null,
    ],
    [
      MoveVertical,
      "Gun elevation",
      s.gunDepression != null && s.gunElevation != null
        ? `${s.gunDepression}° / +${s.gunElevation}°${s.elevationDegS != null ? ` · ${s.elevationDegS.toFixed(1)}°/s` : ""}`
        : null,
    ],
    [Users, "Crew", s.crew != null ? String(s.crew) : null],
    [Weight, "Mass", s.massT != null ? `${s.massT.toFixed(1)} t` : null],
    [Cog, "Engine", s.enginePowerHp != null ? `${Math.round(s.enginePowerHp)} hp` : null],
    [Zap, "Power-to-weight", s.powerToWeight != null ? `${s.powerToWeight.toFixed(1)} hp/t` : null],
    [
      Gauge,
      "Max speed",
      s.maxSpeedFwd != null ? `${Math.round(s.maxSpeedFwd)} / ${Math.round(s.maxSpeedRev ?? 0)} km/h` : null,
    ],
    [Shield, "Hull armor", s.armorHull ? `${s.armorHull.map((x) => Math.round(x)).join(" / ")} mm` : null],
    [ShieldHalf, "Turret armor", s.armorTurret ? `${s.armorTurret.map((x) => Math.round(x)).join(" / ")} mm` : null],
    [Settings2, "Gearbox", s.gearsFwd != null ? `${s.gearsFwd} forward / ${s.gearsRev ?? 0} reverse` : null],
  ];
  return (
    <>
      <StatTiles rows={rows} />
      <p className="mt-2 text-xs text-fg-3">
        Armor is front / side / rear. Speeds are forward / reverse. Reload is basic crew → aced crew. Traverse and
        elevation are for a stock vehicle.
      </p>
    </>
  );
}

function AirStatGrid({ u }: { u: UnitDetail }) {
  const s = u.stats ?? {};
  const n = (v: number | null | undefined, unit: string, digits = 0) =>
    v != null ? `${v.toLocaleString("en", { maximumFractionDigits: digits })} ${unit}` : null;
  const rows: StatRow[] = [
    [
      Gauge,
      "Max speed",
      s.maxSpeedKmh != null ? `${n(s.maxSpeedKmh, "km/h")}${s.maxSpeedAltM ? ` at ${n(s.maxSpeedAltM, "m")}` : ""}` : null,
    ],
    [TrendingUp, "Climb rate", n(s.climbRate, "m/s", 1)],
    [RotateCw, "Turn time", n(s.turnTimeS, "s", 1)],
    [Repeat, "Roll rate", n(s.rollRate, "°/s")],
    [Mountain, "Ceiling", n(s.ceilingM, "m")],
    [Users, "Crew", s.crew != null ? String(s.crew) : null],
  ];
  return <StatTiles rows={rows} />;
}

function StatTiles({ rows }: { rows: StatRow[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {rows
        .filter((r): r is [LucideIcon, string, string] => r[2] !== null)
        .map(([Icon, k, v]) => (
          <div key={k} className="panel px-3 py-2.5">
            <dt className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-fg-3">
              <Icon className="h-4 w-4 shrink-0 text-gold/80" aria-hidden />
              {k}
            </dt>
            <dd className="mt-0.5 pl-6 font-display text-base leading-tight tabular text-fg">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

const fmt = (n: number) => n.toLocaleString("en");

function EconomyBlock({ u }: { u: UnitDetail }) {
  const e = u.economy!;
  const modes = ["ab", "rb", "sb"] as const;
  const costs: [LucideIcon, string, string | null][] = [
    [GraduationCap, "Research", e.researchRp ? `${fmt(e.researchRp)} RP` : null],
    [Coins, "Purchase", e.purchaseGe ? `${fmt(e.purchaseGe)} GE` : e.purchaseSl ? `${fmt(e.purchaseSl)} SL` : null],
    [Users, "Crew training", e.crewSl ? `${fmt(e.crewSl)} SL` : null],
    [Users, "Experts", e.expertsSl ? `${fmt(e.expertsSl)} SL` : null],
    [
      Users,
      "Aces",
      e.acesGe ? `${fmt(e.acesGe)} GE${e.acesRp ? ` or ${fmt(e.acesRp)} RP` : ""}` : null,
    ],
    [GraduationCap, "Research bonus", e.rpPct ? `${e.rpPct}% RP` : null],
  ];
  return (
    <div className="space-y-4">
      <StatTiles rows={costs} />
      <div className="overflow-x-auto panel">
        <table className="data-table w-full min-w-[420px] text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 font-semibold">
                <span className="sr-only">Measure</span>
              </th>
              {modes.map((m) => (
                <th key={m} className="px-3 py-2 text-right font-semibold">
                  {MODE_NAME[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            <tr>
              <td className="px-3 py-1.5 text-fg-2">
                <span className="inline-flex items-center gap-2">
                  <Coins className="h-4 w-4 text-gold/80" aria-hidden /> Silver Lion reward
                </span>
              </td>
              {modes.map((m) => (
                <td key={m} className="px-3 py-1.5 text-right font-display tabular">
                  {e.rewardPct?.[m] != null ? `${Math.round(e.rewardPct[m]!)}%` : "–"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-3 py-1.5 text-fg-2">
                <span className="inline-flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gold/80" aria-hidden /> Repair, stock → upgraded
                </span>
              </td>
              {modes.map((m) => (
                <td key={m} className="px-3 py-1.5 text-right font-display tabular">
                  {e.repairSl?.[m] != null
                    ? `${fmt(Math.round(e.repairSl[m]!))}${e.repairUpgradedSl?.[m] != null ? ` → ${fmt(Math.round(e.repairUpgradedSl[m]!))}` : ""} SL`
                    : "–"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-fg-3">
        From the game&apos;s economy file. SL = Silver Lions, RP = research points, GE = Golden Eagles. Premium account
        and boosters raise rewards further.
      </p>
    </div>
  );
}

function ModificationList({ mods }: { mods: NonNullable<UnitDetail["modifications"]> }) {
  const tiers = [...new Set(mods.map((m) => m.tier ?? 0))].sort((a, b) => a - b);
  const totalRp = mods.reduce((n, m) => n + (m.rp ?? 0), 0);
  const totalSl = mods.reduce((n, m) => n + (m.sl ?? 0), 0);
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-2">
        {mods.length} modifications · {fmt(totalRp)} RP and {fmt(totalSl)} SL to research and buy them all.
      </p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div key={t} className="panel">
            <h3 className="border-b border-card-border px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-fg-3">
              {t ? `Tier ${roman(t)}` : "Other"}
            </h3>
            <ul className="divide-y divide-card-border text-sm">
              {mods
                .filter((m) => (m.tier ?? 0) === t)
                .map((m) => (
                  <li key={m.id} className="flex items-baseline justify-between gap-2 px-3 py-1.5">
                    <span className="min-w-0 text-fg-2">{m.name}</span>
                    <span className="shrink-0 text-right text-xs tabular text-fg-3">
                      {m.rp ? `${fmt(m.rp)} RP` : ""}
                      {m.sl ? <span className="block">{fmt(m.sl)} SL</span> : null}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function marketHref(name: string): string {
  return `https://trade.gaijin.net/market/1067/${encodeURIComponent(name)}`;
}

function gjn(price: number): string {
  return `${price.toLocaleString("en", { maximumFractionDigits: 2 })} GJN`;
}

const SKINS_SHOWN = 12;

function MarketSection({ u, asOf }: { u: UnitDetail; asOf?: string }) {
  const m = u.market;
  const skins = u.skins ?? [];
  return (
    <div className="space-y-4">
      {m && (
        <div className="panel flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-fg-3">Lowest offer</dt>
              <dd className="font-display text-2xl font-bold tabular text-gold">{m.price != null ? gjn(m.price) : "None"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-fg-3">Best buy order</dt>
              <dd className="font-display text-2xl font-bold tabular text-fg">{m.buy != null ? gjn(m.buy) : "None"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-fg-3">Listings</dt>
              <dd className="font-display text-2xl font-bold tabular text-fg">
                {m.sellers ?? 0} <span className="text-sm font-normal text-fg-3">sell</span> · {m.buyers ?? 0}{" "}
                <span className="text-sm font-normal text-fg-3">buy</span>
              </dd>
            </div>
          </dl>
          <a href={marketHref(m.name)} rel="noopener" target="_blank" className="btn ml-auto gap-1.5">
            <Store className="h-4 w-4" aria-hidden />
            Open on the Gaijin Market
          </a>
        </div>
      )}
      {skins.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-fg-3">
            <Paintbrush className="h-4 w-4 text-gold/80" aria-hidden />
            {skins.length} skin{skins.length === 1 ? "" : "s"} for sale
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
            {skins.slice(0, SKINS_SHOWN).map((k) => (
              <li key={k.name}>
                <a
                  href={marketHref(k.name)}
                  rel="noopener"
                  target="_blank"
                  className="panel block overflow-hidden no-underline transition hover:brightness-125"
                >
                  {k.icon && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote Gaijin CDN thumbnail
                    <img src={k.icon} alt="" loading="lazy" className="aspect-[16/9] w-full bg-black/30 object-cover" />
                  )}
                  <span className="block px-2 pt-1.5 text-xs text-fg-2" title={k.title}>
                    <span className="line-clamp-2">{k.title}</span>
                  </span>
                  <span className="block px-2 pb-1.5 font-display text-sm tabular text-gold">
                    {k.price != null ? gjn(k.price) : "No offers"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {skins.length > SKINS_SHOWN && (
            <p className="mt-2 text-sm text-fg-3">
              Plus {skins.length - SKINS_SHOWN} more on the <Link href="/market/">market page</Link>.
            </p>
          )}
        </div>
      )}
      {asOf && <p className="text-xs text-fg-3">Prices as of {asOf}. Trading needs a Gaijin login.</p>}
    </div>
  );
}

/** Nation, plus what tells this vehicle apart from same-named ones in that nation (event copies, cup editions). */
function titleQualifier(u: UnitDetail): string {
  const name = plainName(u.name);
  const twins = getIndex().filter((o) => o.id !== u.id && o.nation === u.nation && plainName(o.name) === name);
  // The one tech tree vehicle among same-named copies keeps the plain title.
  if (!twins.length || (u.status === "tree" && twins.every((o) => o.status !== "tree"))) return nationName(u.nation);
  const extra = twins.every((o) => o.status !== u.status) && u.status !== "tree" ? STATUS_LABEL[u.status] : u.id;
  return `${nationName(u.nation)}, ${extra}`;
}

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
    for (const o of peers)
      units[o.id] = { name: o.name, status: o.status, hidden: o.hidden, br: o.br, image: o.image, type: o.type };
  }
  return { byMode, units };
}
