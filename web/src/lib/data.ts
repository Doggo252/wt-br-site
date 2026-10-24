/**
 * Build-time data access. Reads the ETL output in ../data (see etl/).
 * Server components only: everything here runs during `next build`.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { Meta, NationTree, UnitDetail, UnitSummary, UpdateDiff, VersionInfo } from "./data.gen";

const DATA = join(process.cwd(), "..", "data");

function read<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(DATA, ...parts), "utf8")) as T;
}

export const getMeta = cache(() => read<Meta>("meta.json"));

export const getIndex = cache(() => read<UnitSummary[]>("units", "index.json"));

export const getUnitMap = cache(() => new Map(getIndex().map((u) => [u.id, u])));

export const getUnit = cache((id: string) => read<UnitDetail>("units", `${id}.json`));

export const getTree = cache((nation: string) => read<NationTree>("trees", `${nation}.json`));

export function unitsInNation(nation: string): UnitSummary[] {
  return getIndex().filter((u) => u.nation === nation);
}

// The ETL omits default values (0, []) to keep files small; fill them back in here.

export type Version = Required<Omit<VersionInfo, "major">> & Pick<VersionInfo, "major">;

export const getVersions = cache((): Version[] =>
  read<VersionInfo[]>("versions.json").map((v) => ({
    ...v,
    changes: v.changes ?? 0,
    up: v.up ?? 0,
    down: v.down ?? 0,
    added: v.added ?? 0,
    removed: v.removed ?? 0,
  })),
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
