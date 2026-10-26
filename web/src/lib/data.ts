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
  MarketData,
  StoreData,
  Meta,
  PatchNote,
  PatchNoteSummary,
  NationTree,
  OfficialChange,
  Ranks,
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
        // A post can list one vehicle in two tables (e.g. aircraft and Ground RB): merge them.
        const same = list.find((x) => x.a.id === a.id);
        if (same) {
          const defined = Object.fromEntries(Object.entries(change).filter(([, v]) => v != null));
          same.change = { ...same.change, ...defined, outcome: { ...same.change.outcome, ...change.outcome } };
        } else list.push({ a, change });
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

/** Ranks from the newest announcement that aren't live yet, per vehicle (only the modes it changes). */
export const getPlannedRanks = cache(() => {
  const map = new Map<string, Partial<Ranks>>();
  for (const c of getPendingPlan()?.pending ?? []) {
    const ranks: Partial<Ranks> = {};
    for (const m of ["ab", "rb", "sb"] as const) {
      const pair = c[m];
      if (c.outcome?.[m] === "pending" && pair) ranks[m] = pair[1];
    }
    for (const id of c.ids ?? []) map.set(id, ranks);
  }
  return map;
});

/** Gaijin Market snapshot (data/market.json), or null before the first snapshot. */
export const getMarket = cache((): MarketData | null =>
  existsSync(join(DATA, "market.json")) ? read<MarketData>("market.json") : null,
);

/** Gaijin Store catalog (data/store.json), or null before the first fetch. */
export const getStore = cache((): StoreData | null =>
  existsSync(join(DATA, "store.json")) ? read<StoreData>("store.json") : null,
);

/** Changelog entries (data/patchnotes/index.json), newest first; empty before the first fetch. */
export const getPatchNotes = cache((): PatchNoteSummary[] =>
  existsSync(join(DATA, "patchnotes", "index.json")) ? read<PatchNoteSummary[]>("patchnotes", "index.json") : [],
);

export const getPatchNote = cache((id: number | string) => read<PatchNote>("patchnotes", `${id}.json`));

/** Patch notes for an update page: entries tied to this version, and the smaller ones since the previous update. */
export function patchNotesFor(v: string): { main: PatchNoteSummary[]; since: PatchNoteSummary[] } {
  const versions = getVersions();
  const i = versions.findIndex((x) => x.v === v);
  const notes = getPatchNotes();
  const main = notes.filter((n) => n.forVersion === v);
  if (i < 0) return { main, since: [] };
  const from = i > 0 ? versions[i - 1].d.slice(0, 10) : "0000";
  const to = versions[i].d.slice(0, 10);
  const since = notes.filter((n) => !n.forVersion && n.date > from && n.date <= to);
  return { main, since };
}
