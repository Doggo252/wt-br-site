import type { Metadata } from "next";
import Link from "@/components/Link";
import { TechTree, type TreeUnit } from "@/components/TechTree";
import { formatBr } from "@/lib/br";
import { BRANCHES, BRANCH_NAME, BRANCH_SHORT, branchHref, treeHref, type Branch } from "@/lib/branches";
import { getIndex, getMeta, getPlannedRanks, getTree, nationsOf, unitsInNation } from "@/lib/data";
import { BranchIcon } from "@/components/BranchIcon";
import { Flag } from "@/components/Flag";
import { nationName } from "@/lib/nations";

export function nationParams(branch: Branch) {
  return nationsOf(branch).map((nation) => ({ nation }));
}

export function branchMetadata(branch: Branch): Metadata {
  return {
    title: BRANCH_NAME[branch],
    description: `War Thunder ${BRANCH_NAME[branch].toLowerCase()} tech trees with current Battle Ratings and BR history for every nation.`,
  };
}

export function nationMetadata(branch: Branch, nation: string): Metadata {
  return {
    title: `${nationName(nation)} ${BRANCH_SHORT[branch].toLowerCase()} tech tree`,
    description: `Every ${nationName(nation)} ${BRANCH_NAME[branch].toLowerCase()} vehicle in War Thunder with its current Arcade, Realistic and Simulator Battle Rating, and a time machine back to 2020.`,
  };
}

function BranchTabs({ branch, nation }: { branch: Branch; nation?: string }) {
  return (
    <nav aria-label="Branches" className="mb-5 flex gap-1 border-b border-[#2a333b]">
      {BRANCHES.map((b) => {
        const href = nation && nationsOf(b).includes(nation) ? treeHref(b, nation) : branchHref(b);
        const active = b === branch;
        return (
          <Link
            key={b}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2 font-display text-sm font-semibold uppercase tracking-[0.08em] ${active ? "border-gold text-fg" : "border-transparent text-fg-3 hover:text-fg"}`}
          >
            <BranchIcon branch={b} />
            {BRANCH_SHORT[b]}
          </Link>
        );
      })}
    </nav>
  );
}

export function BranchIndexPage({ branch }: { branch: Branch }) {
  const meta = getMeta();
  const nations = nationsOf(branch);
  const index = getIndex().filter((u) => u.branch === branch && !u.removedIn);
  return (
    <div>
      <BranchTabs branch={branch} />
      <h1 className="text-3xl font-bold sm:text-4xl">{BRANCH_NAME[branch]}</h1>
      <p className="mt-2 text-fg-2">
        {index.length.toLocaleString("en")} vehicles across {nations.length} nations, as of update{" "}
        <span className="font-display tabular text-fg">{meta.version}</span>.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {nations.map((n) => {
          const units = index.filter((u) => u.nation === n);
          // Showcase: the nation's highest-BR tech tree vehicle with an image.
          const star = units
            .filter((u) => u.image && u.status === "tree")
            .sort((a, b) => b.rank - a.rank || b.br.rb - a.br.rb)[0];
          return (
            <li key={n}>
              <Link
                href={treeHref(branch, n)}
                className="panel group relative flex h-28 items-center overflow-hidden px-4 transition hover:-translate-y-px hover:border-[#3d4a54]"
              >
                {star && (
                  // eslint-disable-next-line @next/next/no-img-element -- static export
                  <img
                    src={`/img/units/${star.id}.webp`}
                    alt=""
                    loading="lazy"
                    className="pointer-events-none absolute -right-6 top-1/2 h-[130%] w-auto -translate-y-1/2 opacity-70 drop-shadow-[0_6px_10px_rgb(0_0_0/0.6)] transition duration-300 [mask-image:linear-gradient(90deg,transparent,black_35%)] group-hover:scale-105 group-hover:opacity-90"
                  />
                )}
                <div className="relative">
                  <Flag nation={n} className="mb-2 h-6" />
                  <span className="block font-display text-xl font-semibold text-fg">{nationName(n)}</span>
                  <span className="text-sm text-fg-3">{units.length} vehicles</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NationTreePage({ branch, nation }: { branch: Branch; nation: string }) {
  const tree = getTree(branch, nation);
  const units: Record<string, TreeUnit> = {};
  for (const u of unitsInNation(branch, nation).filter((u) => !u.removedIn)) {
    const planned = getPlannedRanks().get(u.id);
    units[u.id] = { name: u.name, status: u.status, hidden: u.hidden, br: u.br, image: u.image, type: u.type };
    if (u.marketPrice != null) units[u.id].price = u.marketPrice;
    // Premiums: the store pack price, else Golden Eagles.
    else if (u.storePrice != null) units[u.id].cost = `$${u.storePrice}`;
    else if (u.geCost != null && !u.hidden) units[u.id].cost = `${u.geCost.toLocaleString("en")} GE`;
    if (planned) units[u.id].planned = planned;
  }
  const meta = getMeta();
  const list = Object.values(units).filter((u) => !u.hidden);
  const count = (st: string) => list.filter((u) => u.status === st).length;
  const top = Math.max(...list.filter((u) => u.status === "tree").map((u) => u.br.rb), 0);
  const summary: { label: string; value: string | number; className?: string }[] = [
    { label: "Tech tree", value: count("tree") },
    { label: "Premium", value: count("premium") + count("event"), className: "text-premium" },
    { label: "Squadron", value: count("squadron"), className: "text-squadron" },
    { label: "Top RB", value: formatBr(top) },
  ];
  return (
    <div>
      <BranchTabs branch={branch} nation={nation} />
      <nav aria-label="Nations" className="mb-6 flex flex-wrap gap-1.5">
        {nationsOf(branch).map((n) => (
          <Link
            key={n}
            href={treeHref(branch, n)}
            aria-current={n === nation ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 border px-2 py-1 font-display text-sm transition-colors ${
              n === nation
                ? "border-gold/60 bg-gold/10 text-fg"
                : "border-[#2a333b] bg-[#181e23] text-fg-2 hover:border-[#3d4a54] hover:text-fg"
            }`}
          >
            <Flag nation={n} className="h-3" />
            {nationName(n)}
          </Link>
        ))}
      </nav>
      <header className="mb-6 flex items-center gap-4">
        <Flag nation={nation} className="h-12 sm:h-14" />
        <div>
          <p className="eyebrow">{BRANCH_NAME[branch]}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{nationName(nation)}</h1>
          <p className="text-sm text-fg-3">
            {Object.keys(units).length} vehicles · update <span className="tabular">{meta.version}</span>
          </p>
        </div>
        <dl className="ml-auto hidden gap-2 text-center md:flex">
          {summary.map((x) => (
            <div key={x.label} className="panel min-w-20 px-3 py-1.5">
              <dt className="text-[10px] uppercase tracking-wider text-fg-3">{x.label}</dt>
              <dd className={`font-display text-lg font-semibold tabular ${x.className ?? "text-fg"}`}>{x.value}</dd>
            </div>
          ))}
        </dl>
      </header>
      {/* Break out of the page column so wide trees can use the whole window. */}
      <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2">
        <TechTree branch={branch} nation={nation} columns={tree.columns} units={units} />
      </div>
    </div>
  );
}
