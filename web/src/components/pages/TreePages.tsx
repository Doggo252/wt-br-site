import type { Metadata } from "next";
import Link from "next/link";
import { TechTree, type TreeUnit } from "@/components/TechTree";
import { BRANCHES, BRANCH_NAME, BRANCH_SHORT, branchHref, treeHref, type Branch } from "@/lib/branches";
import { getIndex, getMeta, getTree, nationsOf, unitsInNation } from "@/lib/data";
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
    <nav aria-label="Branches" className="mb-3 flex gap-1 border-b border-card-border">
      {BRANCHES.map((b) => {
        const href = nation && nationsOf(b).includes(nation) ? treeHref(b, nation) : branchHref(b);
        const active = b === branch;
        return (
          <Link
            key={b}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-3 py-1.5 font-display text-sm no-underline ${active ? "border-link text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
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
      <h1 className="text-3xl font-bold">{BRANCH_NAME[branch]}</h1>
      <p className="mt-2 text-fg-2">
        {index.length.toLocaleString("en")} vehicles across {nations.length} nations, as of update{" "}
        <span className="font-display tabular text-fg">{meta.version}</span>.
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {nations.map((n) => (
          <li key={n}>
            <Link
              href={treeHref(branch, n)}
              className="relative block border border-card-border bg-card-bg p-4 no-underline before:absolute before:inset-x-0 before:-top-px before:h-[2px] before:bg-card-top before:content-[''] hover:brightness-125"
            >
              <span className="block font-display text-lg font-semibold text-fg">{nationName(n)}</span>
              <span className="text-sm text-fg-3">{index.filter((u) => u.nation === n).length} vehicles</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NationTreePage({ branch, nation }: { branch: Branch; nation: string }) {
  const tree = getTree(branch, nation);
  const units: Record<string, TreeUnit> = {};
  for (const u of unitsInNation(branch, nation).filter((u) => !u.removedIn)) {
    units[u.id] = { name: u.name, status: u.status, hidden: u.hidden, br: u.br, image: u.image };
  }
  const meta = getMeta();
  return (
    <div>
      <BranchTabs branch={branch} nation={nation} />
      <nav aria-label="Nations" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {nationsOf(branch).map((n) =>
          n === nation ? (
            <span key={n} aria-current="page" className="font-display font-semibold text-fg">
              {nationName(n)}
            </span>
          ) : (
            <Link key={n} href={treeHref(branch, n)} className="font-display text-fg-2 no-underline hover:text-fg">
              {nationName(n)}
            </Link>
          ),
        )}
      </nav>
      <h1 className="mb-1 text-3xl font-bold">
        {nationName(nation)} <span className="text-fg-3">· {BRANCH_SHORT[branch]}</span>
      </h1>
      <p className="mb-5 text-sm text-fg-3">
        {Object.keys(units).length} vehicles · update <span className="tabular">{meta.version}</span>
      </p>
      {/* Break out of the page column so wide trees can use the whole window. */}
      <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2">
        <TechTree branch={branch} nation={nation} columns={tree.columns} units={units} />
      </div>
    </div>
  );
}
