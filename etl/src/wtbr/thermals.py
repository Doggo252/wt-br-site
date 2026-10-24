"""Thermal sight generation from sensor resolution (tankmodels/<id>.blkx)."""

GEN_BY_RESOLUTION: dict[tuple[int, int], int] = {
    (500, 300): 1,
    (800, 600): 2,
    (1200, 800): 3,
}


def thermal_gen(width: int, height: int) -> int | None:
    """Generation for a resolution, or None if unmapped (the site then shows it raw)."""
    return GEN_BY_RESOLUTION.get((width, height))
