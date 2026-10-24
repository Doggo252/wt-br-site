/**
 * Build-time data access. Reads the ETL output in ../data (see etl/).
 * Server components only: everything here runs during `next build`.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import type { Meta, NationTree, UnitDetail, UnitSummary } from "./data.gen";

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
