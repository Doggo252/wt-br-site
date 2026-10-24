/**
 * Build-time data access. Reads the ETL output in ../data (see etl/).
 * Server components only: everything here runs during `next build`.
 */
import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { BRANCHES, type Branch } from "./branches";
import type { Meta, NationTree, RecordRow, UnitDetail, UnitSummary, UpdateDiff, VersionInfo } from "./data.gen";

const DATA = join(process.cwd(), "..", "data");

function read<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(DATA, ...parts), "utf8")) as T;
}

export const getMeta = cache(() => read<Meta>("meta.json"));

export const getIndex = cache(() => read<UnitSummary[]>("units", "index.json"));

export const getUnitMap = cache(() => new Map(getIndex().map((u) => [u.id, u])));

export const getUnit = cache((id: string) => read<UnitDetail>("units", `${id}.json`));

export const getTree = cache((branch: string, nation: string) =>
  read<NationTree>("trees", branch, `${nation}.json`),
);

export function unitsInNation(branch: string, nation: string): UnitSummary[] {
  return getIndex().filter((u) => u.branch === branch && u.nation === nation);
}

// The ETL omits default values (0, []) to keep files small; fill them back in here.

type Counts = { changes: number; up: number; down: number; added: number; removed: number };

/** A version with per-branch counts filled in, plus totals across branches. */
export type Version = Pick<VersionInfo, "v" | "d" | "major"> & Counts & { byBranch: Record<Branch, Counts> };

const ZERO: Counts = { changes: 0, up: 0, down: 0, added: 0, removed: 0 };

export const getVersions = cache((): Version[] =>
  read<VersionInfo[]>("versions.json").map((v) => {
    const byBranch = Object.fromEntries(
      BRANCHES.map((b) => [b, { ...ZERO, ...(v.byBranch?.[b] ?? {}) }]),
    ) as Record<Branch, Counts>;
    const total = { ...ZERO };
    for (const c of Object.values(byBranch)) {
      for (const k of Object.keys(total) as (keyof Counts)[]) total[k] += c[k];
    }
    return { v: v.v, d: v.d, major: v.major, ...total, byBranch };
  }),
);

export type Update = UpdateDiff & Required<Pick<UpdateDiff, "changes" | "added" | "removed">>;

export const getUpdate = cache((v: string): Update => {
  const u = read<UpdateDiff>("updates", `${v}.json`);
  return { ...u, changes: u.changes ?? [], added: u.added ?? [], removed: u.removed ?? [] };
});

/** The most recent update with a real batch of BR changes (hotfixes touching a few vehicles are skipped). */
export const getLatestBrUpdate = cache(() => {
  const rev = [...getVersions()].reverse();
  return rev.find((v) => v.changes >= 10) ?? rev.find((v) => v.changes > 0);
});

export function nationsOf(branch: Branch): string[] {
  return getMeta().branches[branch] ?? [];
}

/** Rows of the records sheet; empty if the ETL ran without it. */
export const getRecords = cache((): RecordRow[] =>
  existsSync(join(DATA, "records.json")) ? read<RecordRow[]>("records.json") : [],
);
