/**
 * Build-time data access. Reads the ETL output in ../data (see etl/).
 * Server components only: everything here runs during `next build`.
 */
import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";
import { BRANCHES, type Branch } from "./branches";
import type {
  Announcement,
  DevPreview,
  Meta,
  NationTree,
  OfficialChange,
  RecordRow,
  UnitDetail,
  UnitSummary,
  UpdateDiff,
  VersionInfo,
} from "./data.gen";

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

/** Dev-server preview, only present while the newest datamine build is a dev-server build. */
export const getDev = cache((): DevPreview | null =>
  existsSync(join(DATA, "dev.json")) ? read<DevPreview>("dev.json") : null,
);

/** Gaijin's BR change announcements, newest first; empty if the ETL ran without them. */
export const getAnnouncements = cache((): Announcement[] =>
  existsSync(join(DATA, "official.json")) ? read<Announcement[]>("official.json") : [],
);

export type VehicleAnnouncement = { a: Announcement; change: OfficialChange };

/** Announcement rows that mention each vehicle, newest first. */
export const getAnnouncementsByUnit = cache(() => {
  const map = new Map<string, VehicleAnnouncement[]>();
  for (const a of getAnnouncements()) {
    for (const change of a.changes ?? []) {
      for (const id of change.ids ?? []) {
        const list = map.get(id) ?? [];
        list.push({ a, change });
        map.set(id, list);
      }
    }
  }
  return map;
});

/** The newest planned announcement with changes not live yet, if any. */
export const getPendingPlan = cache(() => {
  const a = getAnnouncements().find((x) => x.kind === "planned");
  if (!a) return null;
  const pending = (a.changes ?? []).filter((c) => Object.values(c.outcome ?? {}).includes("pending"));
  return pending.length ? { a, pending } : null;
});
