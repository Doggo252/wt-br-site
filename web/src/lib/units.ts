/** Shared unit vocabulary. Step 2 replaces the hand-written types with ones generated from the ETL's JSON Schema. */

export type Branch = "ground" | "air" | "heli" | "naval";

/** How a vehicle is obtained, which picks its card colors. */
export type UnitStatus = "tree" | "premium" | "squadron" | "event";

/**
 * Where a vehicle stands at the version being viewed.
 * "notYet" is used by the time machine for vehicles added after that version.
 */
export type Availability = "current" | "removed" | "notYet";

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
