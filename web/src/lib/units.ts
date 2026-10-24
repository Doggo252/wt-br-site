/** Shared unit vocabulary. Step 2 replaces the hand-written types with ones generated from the ETL's JSON Schema. */

export type Branch = "ground" | "air" | "heli" | "naval";

/** How a vehicle is obtained, which picks its card colors. */
export type UnitStatus = "tree" | "premium" | "squadron" | "event";

/**
 * Where a vehicle stands at the version being viewed.
 * "unobtainable": in the game but hidden from the tree unless owned (old events, removed premiums).
 * "removed": gone from the game files at that version.
 * "notYet": the time machine is showing a version before the vehicle was added.
 */
export type Availability = "current" | "unobtainable" | "removed" | "notYet";

export type CrewRole = "commander" | "gunner" | "driver";

export const CREW_LABEL: Record<CrewRole, string> = {
  commander: "Commander",
  gunner: "Gunner",
  driver: "Driver",
};

/** Thermal generations by sensor resolution. Unmapped resolutions are shown raw. */
export const THERMAL_GEN_BY_RESOLUTION: Record<string, 1 | 2 | 3> = {
  "500x300": 1,
  "800x600": 2,
  "1200x800": 3,
};

export type Sight =
  | { kind: "thermal"; gen?: 1 | 2 | 3; resolution?: [number, number] }
  | { kind: "nv" }
  | { kind: "none" };
