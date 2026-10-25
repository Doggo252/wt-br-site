import type { Metadata } from "next";
import Link from "next/link";
import { getMeta, getVersions } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Where Uptier's War Thunder BR history comes from and how it is built.",
};

export default function AboutPage() {
  const meta = getMeta();
  const versions = getVersions();
  return (
    <article className="prose max-w-2xl space-y-8 leading-relaxed">
      <header>
        <h1 className="text-4xl font-bold">About Uptier</h1>
        <p className="mt-2 text-fg-2">
          Uptier shows the Battle Rating history of every War Thunder ground vehicle, update by update. It is a fan
          project and is not affiliated with or endorsed by Gaijin Entertainment.
        </p>
      </header>

      <Section title="Where the data comes from">
        <ul className="list-disc space-y-2 pl-5 text-fg-2">
          <li>
            <strong className="text-fg">Battle Ratings, tech trees, names and stats</strong> come from the{" "}
            <a href="https://github.com/gszabi99/War-Thunder-Datamine">War Thunder Datamine</a>, which unpacks every
            game build into readable files. Its history starts at update 1.95.1.7 on {versions[0]?.d}.
          </li>
          <li>
            <strong className="text-fg">Vehicle images</strong> are copied from the official War Thunder
            encyclopedia&apos;s image server.
          </li>
          <li>
            <strong className="text-fg">Kill records</strong> come from the community{" "}
            <a href="https://docs.google.com/spreadsheets/d/1MJEjscVDZ1hgU7fHp6dB0levgh6rnpXwOlI7fTBXly0">
              Ground RB Records sheet
            </a>
            , which collects and verifies them.
          </li>
        </ul>
        <p className="mt-3 text-sm text-fg-3">
          Current data: update <span className="tabular">{meta.version}</span>, rebuilt daily.
        </p>
      </Section>

      <Section title="How BR history is worked out">
        <ul className="list-disc space-y-2 pl-5 text-fg-2">
          <li>
            The game stores BR as an &ldquo;economic rank&rdquo; per mode. BR = rank ÷ 3 + 1, so rank 14 is 5.7.
          </li>
          <li>
            Every game build in the datamine since March 2020 is compared with the one before. A change is recorded
            when a vehicle&apos;s rank changes in any mode. {versions.length} versions changed something on the ground.
          </li>
          <li>
            The datamine also contains dev-server builds, mixed in with live ones. A build only counts as live if no
            later build has a lower version number, so test-server BRs don&apos;t show up as real changes.
          </li>
          <li>
            Dates are when a build appeared in the datamine, usually the day it went live.
          </li>
          <li>
            A vehicle counts as in the game when it is in a nation&apos;s tech tree. Temporary event-mode vehicles (April
            Fools and similar) are left out.
          </li>
          <li>
            Vehicles that were already in the game in March 2020 show &ldquo;in game before tracking began&rdquo;.
          </li>
        </ul>
      </Section>

      <Section title="Thermal generations">
        <p className="text-fg-2">
          Night sights are read from each vehicle&apos;s model file, per crew position. Thermal sensor resolution maps
          to a generation: 500×300 is Gen 1, 800×600 is Gen 2 and 1200×800 is Gen 3. Sights that need a researched
          modification are marked &ldquo;mod&rdquo;.
        </p>
      </Section>

      <Section title="Source code">
        <p className="text-fg-2">
          Uptier is open source on <a href="https://github.com/Doggo252/wt-br-site">GitHub</a>. Found a mistake?{" "}
          <a href="https://github.com/Doggo252/wt-br-site/issues">Open an issue</a>.
        </p>
      </Section>

      <p className="text-sm text-fg-3">
        War Thunder and all related names, images and data are the property of Gaijin Entertainment.{" "}
        <Link href="/design/">Style guide</Link>
      </p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="section-title mb-3">{title}</h2>
      {children}
    </section>
  );
}
