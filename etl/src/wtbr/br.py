"""Battle Rating conversion.

The datamine stores BR as an integer "economic rank" per mode in
char.vromfs.bin_u/config/wpcost.blkx (economicRankArcade/Historical/Simulation).
BR = rank / 3 + 1. Output JSON keeps the raw rank; the site converts for display.
Mirrors web/src/lib/br.ts.
"""

from typing import Literal

Mode = Literal["ab", "rb", "sb"]

# wpcost.blkx field for each mode. "Historical" is Realistic Battles.
WPCOST_FIELD: dict[Mode, str] = {
    "ab": "economicRankArcade",
    "rb": "economicRankHistorical",
    "sb": "economicRankSimulation",
}


def rank_to_br(rank: int) -> float:
    if rank < 0:
        raise ValueError(f"economic rank must be >= 0, got {rank}")
    return rank / 3 + 1


def format_br(rank: int) -> str:
    return f"{rank_to_br(rank):.1f}"
