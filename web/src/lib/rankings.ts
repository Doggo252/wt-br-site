import type { UnitDetail } from "./data.gen";

/** One leaderboard. `get` runs at build time (app/data/rankings.json); the rest ships to the client. */
export type Metric = {
  key: string;
  title: string;
  branches: ("ground" | "air" | "heli")[];
  unit: string;
  /** "desc": highest first. */
  dir: "desc" | "asc";
  digits?: number;
  get: (u: UnitDetail) => number | null | undefined;
};

const rounds = (u: UnitDetail) => (u.guns ?? []).flatMap((g) => g.ammo.flatMap((o) => o.rounds));
const maxOf = (xs: (number | null | undefined)[]) => {
  const v = xs.filter((x): x is number => x != null && x > 0);
  return v.length ? Math.max(...v) : null;
};

export const METRICS: Metric[] = [
  { key: "speed", title: "Fastest", branches: ["ground"], unit: "km/h", dir: "desc", get: (u) => u.stats?.maxSpeedFwd },
  { key: "reverse", title: "Fastest in reverse", branches: ["ground"], unit: "km/h", dir: "desc", get: (u) => u.stats?.maxSpeedRev },
  { key: "ptw", title: "Best power-to-weight", branches: ["ground"], unit: "hp/t", dir: "desc", digits: 1, get: (u) => u.stats?.powerToWeight },
  { key: "hp", title: "Most powerful engine", branches: ["ground"], unit: "hp", dir: "desc", get: (u) => u.stats?.enginePowerHp },
  { key: "heavy", title: "Heaviest", branches: ["ground"], unit: "t", dir: "desc", digits: 1, get: (u) => u.stats?.massT },
  { key: "light", title: "Lightest", branches: ["ground"], unit: "t", dir: "asc", digits: 1, get: (u) => u.stats?.massT },
  {
    key: "pen",
    title: "Most penetration (kinetic)",
    branches: ["ground"],
    unit: "mm",
    dir: "desc",
    get: (u) => maxOf(rounds(u).map((r) => r.pen?.[0])),
  },
  {
    key: "jet",
    title: "Most penetration (HEAT and ATGM)",
    branches: ["ground"],
    unit: "mm",
    dir: "desc",
    get: (u) => maxOf(rounds(u).map((r) => r.jet)),
  },
  {
    key: "velocity",
    title: "Fastest shell",
    branches: ["ground"],
    unit: "m/s",
    dir: "desc",
    get: (u) => maxOf(rounds(u).filter((r) => !r.guidance).map((r) => r.speed)),
  },
  {
    key: "caliber",
    title: "Biggest gun",
    branches: ["ground"],
    unit: "mm",
    dir: "desc",
    get: (u) => maxOf((u.guns ?? []).filter((g) => !/missile|launcher/i.test(g.name)).map((g) => g.caliber)),
  },
  {
    key: "reload",
    title: "Fastest reload (aced crew)",
    branches: ["ground"],
    unit: "s",
    dir: "asc",
    digits: 1,
    // Cannons of 75 mm and up: autocannons would fill the board otherwise.
    get: (u) => ((u.guns?.[0]?.caliber ?? 0) >= 75 ? u.stats?.reloadS : null),
  },
  { key: "depression", title: "Best gun depression", branches: ["ground"], unit: "°", dir: "asc", get: (u) => u.stats?.gunDepression },
  { key: "traverse", title: "Fastest turret traverse", branches: ["ground"], unit: "°/s", dir: "desc", digits: 1, get: (u) => u.stats?.traverseDegS },
  { key: "ammo", title: "Most main-gun ammo", branches: ["ground"], unit: "rounds", dir: "desc", get: (u) => u.stats?.ammo },
  { key: "hull", title: "Thickest hull front", branches: ["ground"], unit: "mm", dir: "desc", get: (u) => u.stats?.armorHull?.[0] },
  { key: "turret", title: "Thickest turret front", branches: ["ground"], unit: "mm", dir: "desc", get: (u) => u.stats?.armorTurret?.[0] },
  { key: "airspeed", title: "Fastest", branches: ["air", "heli"], unit: "km/h", dir: "desc", get: (u) => u.stats?.maxSpeedKmh },
  { key: "climb", title: "Best climb rate", branches: ["air", "heli"], unit: "m/s", dir: "desc", digits: 1, get: (u) => u.stats?.climbRate },
  { key: "turn", title: "Quickest turn", branches: ["air"], unit: "s", dir: "asc", digits: 1, get: (u) => u.stats?.turnTimeS },
  { key: "ceiling", title: "Highest ceiling", branches: ["air"], unit: "m", dir: "desc", get: (u) => u.stats?.ceilingM },
  { key: "roll", title: "Fastest roll", branches: ["air"], unit: "°/s", dir: "desc", get: (u) => u.stats?.rollRate },
  {
    key: "repair",
    title: "Most expensive repair (RB)",
    branches: ["ground", "air", "heli"],
    unit: "SL",
    dir: "desc",
    get: (u) => u.economy?.repairSl?.rb,
  },
  {
    key: "reward",
    title: "Best SL multiplier (RB)",
    branches: ["ground", "air", "heli"],
    unit: "%",
    dir: "desc",
    get: (u) => u.economy?.rewardPct?.rb,
  },
  {
    key: "research",
    title: "Most research to unlock",
    branches: ["ground", "air", "heli"],
    unit: "RP",
    dir: "desc",
    get: (u) => (u.status === "tree" ? u.economy?.researchRp : null),
  },
];
