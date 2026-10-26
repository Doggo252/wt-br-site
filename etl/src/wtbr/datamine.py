"""Access to gszabi99/War-Thunder-Datamine.

Current data uses a shallow, blobless clone with a sparse checkout of only the
files we read, which takes seconds instead of downloading the whole repo.
"""

import json
import subprocess
from pathlib import Path
from typing import Any

REPO_URL = "https://github.com/gszabi99/War-Thunder-Datamine.git"

WPCOST = "char.vromfs.bin_u/config/wpcost.blkx"
SHOP = "char.vromfs.bin_u/config/shop.blkx"
UNITTAGS = "char.vromfs.bin_u/config/unittags.blkx"
UNITS_CSV = "lang.vromfs.bin_u/lang/units.csv"
WEAPONRY_CSV = "lang.vromfs.bin_u/lang/units_weaponry.csv"
MODIFICATIONS_CSV = "lang.vromfs.bin_u/lang/units_modifications.csv"
TANKMODELS = "aces.vromfs.bin_u/gamedata/units/tankmodels"
GROUND_WEAPONS = "aces.vromfs.bin_u/gamedata/weapons/groundmodels_weapons"
EXPLOSIVE = "aces.vromfs.bin_u/gamedata/damage_model/explosive.blkx"
COUNTRY_ICONS = "atlases.vromfs.bin_u/gameuiskin"
VERSION = "version"

SPARSE_PATHS = [
    VERSION,
    WPCOST,
    SHOP,
    UNITTAGS,
    UNITS_CSV,
    WEAPONRY_CSV,
    MODIFICATIONS_CSV,
    f"{TANKMODELS}/*",
    f"{GROUND_WEAPONS}/*",
    EXPLOSIVE,
    f"{COUNTRY_ICONS}/country_*.svg",
]


def _git(repo: Path, *args: str) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), "-c", "gc.auto=0", *args],
        check=True,
        capture_output=True,
        text=True,
    ).stdout


class Datamine:
    def __init__(self, path: Path):
        self.path = path

    def sync(self, rev: str | None = None) -> None:
        """Clone if missing, then check out `rev` (a commit sha) or the latest upstream commit.
        Only the files in SPARSE_PATHS are downloaded."""
        if not (self.path / ".git").exists():
            self.path.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [
                    "git", "clone", "--depth", "1", "--filter=blob:none",
                    "--no-checkout", REPO_URL, str(self.path),
                ],
                check=True,
            )  # fmt: skip
        _git(self.path, "fetch", "--depth", "1", "--filter=blob:none", "origin", rev or "HEAD")
        _git(self.path, "reset", "--soft", "FETCH_HEAD")
        _git(self.path, "sparse-checkout", "set", "--no-cone", *SPARSE_PATHS)
        _git(self.path, "checkout", "-f", "HEAD")

    @property
    def commit(self) -> str:
        return _git(self.path, "rev-parse", "HEAD").strip()

    @property
    def commit_date(self) -> str:
        return _git(self.path, "log", "-1", "--format=%cI").strip()

    @property
    def version(self) -> str:
        return (self.path / VERSION).read_text().strip()

    def read_json(self, rel: str) -> Any:
        return json.loads((self.path / rel).read_text(encoding="utf-8"))

    def read_text(self, rel: str) -> str:
        return (self.path / rel).read_text(encoding="utf-8")

    def weapon(self, blk: str) -> dict | None:
        """'gameData/Weapons/groundModels_weapons/88mm_KwK36_user_cannon.blk' -> its .blkx."""
        stem = blk.rsplit("/", 1)[-1].lower().removesuffix(".blk")
        f = self.path / GROUND_WEAPONS / f"{stem}.blkx"
        return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None

    def tankmodel(self, unit_id: str) -> dict | None:
        """Tank model files are lower-case, unlike wpcost IDs."""
        f = self.path / TANKMODELS / f"{unit_id.lower()}.blkx"
        return json.loads(f.read_text(encoding="utf-8")) if f.exists() else None
