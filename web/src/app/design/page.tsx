import type { Metadata } from "next";
import { UnitCard, type UnitCardProps } from "@/components/UnitCard";
import { BrBadge } from "@/components/BrBadge";
import { ThermalChip } from "@/components/ThermalChip";
import { Arrow } from "@/components/Arrow";
import { contrastRatio } from "@/lib/contrast";
import { GlyphFontStatus, ModeToggleDemo } from "./DesignDemos";

export const metadata: Metadata = {
  title: "Design system",
  description: "Uptier's design tokens and components.",
};

const COLORS: { group: string; isText?: boolean; tokens: { name: string; value: string; note?: string }[] }[] = [
  {
    group: "Surfaces",
    tokens: [
      { name: "bg", value: "#11141A", note: "Page background" },
      { name: "panel", value: "#1B2226", note: "Panels, chips" },
      { name: "header", value: "#2D343C", note: "Header bar, active toggle" },
    ],
  },
  {
    group: "Text",
    isText: true,
    tokens: [
      { name: "fg", value: "#FFFFFF" },
      { name: "fg-2", value: "#C0C0C0", note: "commonTextColor" },
      { name: "fg-3", value: "#A0A0A0", note: "minorTextColor, lightened for contrast" },
    ],
  },
  {
    group: "Accents",
    isText: true,
    tokens: [
      { name: "link", value: "#17CBFC" },
      { name: "gold", value: "#F9DB78" },
      { name: "good", value: "#20F020", note: "BR went down" },
      { name: "bad", value: "#FF4B38", note: "BR went up" },
      { name: "premium", value: "#B19B62" },
      { name: "squadron", value: "#82A952" },
    ],
  },
];

const CARD_STATES = [
  { name: "Default", bg: "#1A2228", border: "#233844", top: "#2F4B5C" },
  { name: "Premium", bg: "#2D250F", border: "#5B471F", top: "#7B591F" },
  { name: "Squadron", bg: "#263A1C", border: "#3E5C2C", top: "#4B712F" },
  { name: "Disabled", bg: "#101514", border: "#2B2C27", top: "#43463B" },
];

// Sample cards only. Names and ranks are illustrative, not real data.
const CARDS: { label: string; props: UnitCardProps }[] = [
  { label: "Tech tree", props: { name: "Tiger H1", rank: 15 } },
  { label: "Premium", props: { name: "Tiger H1 (Ersatz)", rank: 15, status: "premium" } },
  { label: "Squadron", props: { name: "Leopard 2A4M", rank: 30, status: "squadron" } },
  { label: "Event", props: { name: "␠Tiger", rank: 15, status: "event" } },
  { label: "Uptier this patch", props: { name: "T-34 (1941)", rank: 10, previousRank: 9 } },
  { label: "Downtier this patch", props: { name: "M1A1 Abrams", rank: 30, previousRank: 31 } },
  { label: "Selected", props: { name: "Panther D", rank: 16, selected: true } },
  { label: "Removed", props: { name: "Sd.Kfz.234/1", rank: 5, availability: "removed" } },
  { label: "Not yet added (time machine)", props: { name: "Leopard 2A7V", rank: 35, availability: "notYet" } },
  { label: "Long name truncates", props: { name: "Pz.Kpfw. VI Ausf. B Tiger II (Henschel)", rank: 18 } },
];

/** Glyphs used in vehicle names, with the vehicles that use them. */
const GLYPHS = [
  { char: "◍", code: "U+25CD", use: "Six _sm vehicles (🌩️ in the records sheet)" },
  { char: "␠", code: "U+2420", use: "Tiger, animal version (🐾)" },
  { char: "▂", code: "U+2582", use: "T-III (★)" },
  { char: "␙", code: "U+2419", use: "M1A1 Abrams, YouTube Cup 2019" },
  { char: "⋠", code: "U+22E0", use: "Country symbol" },
  { char: "␕", code: "U+2415", use: "Country symbol" },
  { char: "␖", code: "U+2416", use: "Country symbol" },
  { char: "␗", code: "U+2417", use: "Country symbol" },
  { char: "␘", code: "U+2418", use: "Country symbol" },
  { char: "␞", code: "U+241E", use: "Country symbol" },
  { char: "␟", code: "U+241F", use: "Country symbol" },
  { char: "▀", code: "U+2580", use: "Country symbol" },
  { char: "▃", code: "U+2583", use: "Country symbol" },
  { char: "▄", code: "U+2584", use: "Country symbol" },
  { char: "▅", code: "U+2585", use: "Country symbol" },
  { char: "▇", code: "U+2587", use: "Country symbol" },
  { char: "█", code: "U+2588", use: "Country symbol" },
  { char: "◄", code: "U+25C4", use: "Country symbol" },
  { char: "◊", code: "U+25CA", use: "Country symbol" },
  { char: "◐", code: "U+25D0", use: "Country symbol" },
  { char: "", code: "U+F059", use: "Country symbol" },
];

export default function DesignPage() {
  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-4xl font-bold">Design system</h1>
        <p className="mt-2 max-w-2xl text-fg-2">
          Uptier copies War Thunder&apos;s own UI. Colors come from <code>gui/const/colors.css</code> and{" "}
          <code>gui/csselems/unitcard.css</code> in the datamine. The site is dark only.
        </p>
      </header>

      <Section title="Colors" note="Text and accent colors show their contrast against the page background. 4.5:1 passes WCAG AA for body text.">
        <div className="space-y-6">
          {COLORS.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-3">{group.group}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {group.tokens.map((t) => (
                  <Swatch key={t.name} {...t} showContrast={group.isText} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" note="Fira Sans Condensed for headings, cards and numbers. PT Sans for body text.">
        <div className="space-y-4 panel p-5">
          <p className="font-display text-4xl font-bold">Fira Sans Condensed 700</p>
          <p className="font-display text-2xl font-semibold">Fira Sans Condensed 600: Tiger H1 → 6.7</p>
          <p className="font-display text-lg">
            Tabular numbers: <span className="tabular">1.0 1.3 1.7 2.0 11.7 12.0</span>
          </p>
          <p className="max-w-prose">
            PT Sans 400. The Tiger H1 moved from 5.7 to 6.0 in Realistic Battles, then back again two updates later.
            Body text uses <strong>PT Sans 700</strong> for emphasis.
          </p>
          <p className="text-sm text-fg-2">Secondary text (fg-2) for metadata and captions.</p>
          <p className="text-sm text-fg-3">Minor text (fg-3) for labels. Avoid it on card backgrounds.</p>
        </div>
      </Section>

      <Section
        title="Unit card"
        note="120–180 px wide. Background, 1px border and 2px top line come from unitcard.css."
      >
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARD_STATES.map((s) => (
            <div key={s.name} className="panel p-3 text-xs">
              <div className="mb-2 font-display text-sm font-semibold">{s.name}</div>
              {(["bg", "border", "top"] as const).map((k) => (
                <div key={k} className="flex items-center gap-2 font-mono text-fg-2">
                  <span className="h-3 w-3 border border-fg/20" style={{ background: s[k] }} />
                  <span className="w-12 text-fg-3">{k}</span>
                  {s[k]}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-5">
          {CARDS.map((c) => (
            <figure key={c.label} className="space-y-1.5">
              <UnitCard {...c.props} href={c.props.availability ? undefined : "#unit-card"} />
              <figcaption className="text-xs text-fg-3">{c.label}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-sm text-fg-2">
          BR going up is shown in red and going down in green, from the point of view of a player of that vehicle.
          Every change also has an arrow, so color is never the only signal.
        </p>
      </Section>

      <Section title="BR badge" note="Takes the raw economic rank. BR = rank / 3 + 1.">
        <div className="flex flex-wrap items-baseline gap-8 panel p-5">
          <BrBadge rank={15} size="lg" />
          <BrBadge rank={15} mode="rb" />
          <BrBadge rank={16} mode="rb" fromRank={15} />
          <BrBadge rank={27} mode="ab" fromRank={30} />
          <BrBadge rank={0} mode="sb" size="sm" />
        </div>
      </Section>

      <Section title="Mode toggle" note="Keyboard: Tab to focus, arrow keys to switch.">
        <div className="panel p-5">
          <ModeToggleDemo />
        </div>
      </Section>

      <Section
        title="Thermal chips"
        note="One per crew position. 500×300 = Gen 1, 800×600 = Gen 2, 1200×800 = Gen 3. Unmapped resolutions show raw."
      >
        <div className="space-y-3 panel p-5">
          <div className="flex flex-wrap gap-2">
            <ThermalChip crew="commander" sight={{ kind: "thermal", gen: 3, resolution: [1200, 800] }} />
            <ThermalChip crew="gunner" sight={{ kind: "thermal", gen: 2, resolution: [800, 600] }} />
            <ThermalChip crew="driver" sight={{ kind: "thermal", gen: 1, resolution: [500, 300] }} />
          </div>
          <div className="flex flex-wrap gap-2">
            <ThermalChip crew="commander" sight={{ kind: "none" }} />
            <ThermalChip crew="gunner" sight={{ kind: "nv" }} />
            <ThermalChip crew="driver" sight={{ kind: "thermal", resolution: [1600, 900] }} />
          </div>
        </div>
      </Section>

      <Section
        title="Name glyphs"
        note={'The game draws these from symbols_skyquake.ttf, loaded here as "WTSymbols" with a unicode-range.'}
      >
        <div className="space-y-4 panel p-5">
          <GlyphFontStatus />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
            {GLYPHS.map((g) => (
              <div key={g.code} className="flex items-center gap-3 border border-card-border bg-card-bg px-3 py-2">
                <span className="w-8 text-center font-display text-2xl">{g.char}</span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-fg-2">{g.code}</span>
                  <span className="block truncate text-xs text-fg-3" title={g.use}>
                    {g.use}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-fg-2">
            U+2580–25E5 includes <code>▲▼◆</code>, so UI text never uses those characters. Arrows are SVG:{" "}
            <span className="text-bad">
              <Arrow dir="up" />
            </span>{" "}
            <span className="text-good">
              <Arrow dir="down" />
            </span>
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/\s+/g, "-");
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-16">
      <h2 id={`${id}-h`} className="section-title">
        {title}
      </h2>
      {note && <p className="mb-4 mt-1 text-sm text-fg-2">{note}</p>}
      {children}
    </section>
  );
}

function Swatch({
  name,
  value,
  note,
  showContrast = false,
}: {
  name: string;
  value: string;
  note?: string;
  showContrast?: boolean;
}) {
  const ratio = contrastRatio(value, "#11141A");
  return (
    <div className="panel">
      <div className="h-14 border-b border-card-border" style={{ background: value }} />
      <div className="space-y-0.5 p-2 text-xs">
        <div className="font-display text-sm font-semibold">{name}</div>
        <div className="font-mono text-fg-2">{value}</div>
        {showContrast && (
          <div className={`tabular ${ratio >= 4.5 ? "text-fg-3" : "text-gold"}`}>
            {ratio.toFixed(2)}:1{ratio < 4.5 && " (not for body text)"}
          </div>
        )}
        {note && <div className="text-fg-3">{note}</div>}
      </div>
    </div>
  );
}
