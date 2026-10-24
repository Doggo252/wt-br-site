/**
 * Battle Rating helpers.
 *
 * The datamine stores BR as an integer "economic rank" per mode
 * (wpcost.blkx: economicRankArcade / Historical / Simulation).
 * BR = rank / 3 + 1, shown to one decimal: 0 -> 1.0, 1 -> 1.3, 2 -> 1.7, 3 -> 2.0.
 * Data files keep the raw rank; convert only for display.
 */

export type Mode = "ab" | "rb" | "sb";

export const MODES: readonly Mode[] = ["ab", "rb", "sb"];

export const MODE_LABEL: Record<Mode, string> = {
  ab: "AB",
  rb: "RB",
  sb: "SB",
};

export const MODE_NAME: Record<Mode, string> = {
  ab: "Arcade",
  rb: "Realistic",
  sb: "Simulator",
};

export function rankToBr(rank: number): number {
  return rank / 3 + 1;
}

export function formatBr(rank: number): string {
  return rankToBr(rank).toFixed(1);
}

/** Signed BR difference between two ranks, e.g. "+0.3" or "−1.0". */
export function formatBrDelta(fromRank: number, toRank: number): string {
  const delta = (toRank - fromRank) / 3;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  return `${sign}${Math.abs(delta).toFixed(1)}`;
}
