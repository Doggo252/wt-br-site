"""BR history from the datamine's git history.

The datamine has one commit per game build since 1.95.1.7 (2020-03). We use a
blobless clone of the full history (commits and trees only, ~50 MB) and fetch
just the wpcost.blkx and shop.blkx versions we need in batched requests.

Dev-server builds are interleaved with live ones (e.g. 2.0.0.8 between
1.101.2.58 and 1.101.2.64). A commit counts as live only if no later commit
has a lower version.
"""

import gzip
import json
import re
import subprocess
from collections.abc import Iterable
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from .datamine import REPO_URL, SHOP, WPCOST
from .parse import MOVE_BRANCH, SECTION_BRANCH, nation_of, parse_shop

VERSION_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)\.(\d+)")
FETCH_BATCH = 150


def version_key(v: str) -> tuple[int, ...]:
    m = VERSION_RE.match(v)
    if not m:
        raise ValueError(f"not a version: {v}")
    return tuple(int(x) for x in m.groups())


def _git(repo: Path, *args: str, input: str | None = None) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), "-c", "gc.auto=0", *args],
        check=True,
        capture_output=True,
        text=True,
        input=input,
    ).stdout


PENDING_DAYS = 14


def classify(versions: list[str], dates: list[str], now: datetime | None = None):
    """(live, pending) flags per commit, oldest first.

    Live: no later commit has a lower version. That catches dev-server builds of the next
    major update interleaved with live patches, but not dev builds at the very end of the
    history (nothing later to compare with). So: if the newest builds are of a major that
    already showed up as dev builds, and the last older-major build is under PENDING_DAYS
    old, treat those newest builds as pending (probably still on the dev server).
    """
    n = len(versions)
    live = [False] * n
    floor: tuple[int, ...] | None = None
    for i in range(n - 1, -1, -1):
        k = version_key(versions[i])
        if floor is None or k <= floor:
            live[i] = True
            floor = k

    pending = [False] * n
    if n:
        major = [version_key(v)[:2] for v in versions]
        last = major[-1]
        older = [i for i in range(n) if major[i] < last]
        if older:
            p = older[-1]
            had_dev = any(major[j] == last for j in range(p))
            age = (now or datetime.now(UTC)) - datetime.fromisoformat(dates[p])
            if had_dev and age < timedelta(days=PENDING_DAYS):
                for j in range(p + 1, n):
                    if major[j] == last:
                        live[j], pending[j] = False, True
    return live, pending


@dataclass
class Commit:
    sha: str
    date: str
    version: str
    live: bool
    blobs: dict[str, str]  # path -> blob sha, for tracked paths changed in this commit
    pending: bool = False  # newest builds that are probably still dev-server (see classify)


class History:
    def __init__(self, path: Path):
        self.path = path

    def sync(self) -> None:
        if not self.path.exists():
            self.path.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["git", "clone", "--bare", "--filter=blob:none", REPO_URL, str(self.path)],
                check=True,
            )
        else:
            # Bare clones have no fetch refspec; update the branches explicitly.
            _git(self.path, "fetch", "--filter=blob:none", "origin", "+refs/heads/*:refs/heads/*")

    def commits(self, paths: Iterable[str] = (WPCOST, SHOP)) -> list[Commit]:
        """All commits, oldest first, with live/dev classification and tracked blob changes."""
        paths = list(paths)
        log = _git(self.path, "log", "--reverse", "--format=C%x09%H%x09%cI%x09%s", "HEAD")
        rows = [line.split("\t", 3) for line in log.splitlines() if line.startswith("C\t")]

        raw = _git(
            self.path, "log", "--raw", "--no-abbrev", "--no-renames",
            "--format=C%x09%H", "HEAD", "--", *paths,
        )  # fmt: skip
        changed: dict[str, dict[str, str]] = {}
        current = None
        for line in raw.splitlines():
            if line.startswith("C\t"):
                current = line.split("\t")[1]
            elif line.startswith(":") and current:
                meta, path = line.split("\t", 1)
                new_blob = meta.split()[3]
                if set(new_blob) != {"0"}:
                    changed.setdefault(current, {})[path] = new_blob

        # Versions: commits without one ("Fixing my screwup") inherit the previous version.
        versions: list[str] = []
        last = "0.0.0.0"
        for _, _, _, subject in rows:
            m = VERSION_RE.match(subject)
            last = ".".join(m.groups()) if m else last
            versions.append(last)

        live, pending = classify(versions, [r[2] for r in rows])
        return [
            Commit(sha, date, versions[i], live[i], changed.get(sha, {}), pending[i])
            for i, (_, sha, date, _) in enumerate(rows)
        ]

    def fetch_blobs(self, blobs: list[str]) -> None:
        for i in range(0, len(blobs), FETCH_BATCH):
            _git(
                self.path, "-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q",
                "--no-tags", "--no-write-fetch-head", "--filter=blob:none",
                "origin", *blobs[i : i + FETCH_BATCH],
            )  # fmt: skip


# --- per-blob extraction, cached -------------------------------------------------


def _wpcost_extract(repo: str, blob: str) -> dict:
    """{id: [ab, rb, sb, moveType, nation, tier]} for every unit with a move type."""
    data = json.loads(_git(Path(repo), "cat-file", "blob", blob))
    out = {}
    for uid, u in data.items():
        if isinstance(u, dict) and u.get("unitMoveType"):
            out[uid] = [
                int(u.get("economicRankArcade", 0)),
                int(u.get("economicRankHistorical", 0)),
                int(u.get("economicRankSimulation", 0)),
                u["unitMoveType"],
                nation_of(u.get("country", "")),
                int(u.get("rank", 0)),
            ]
    return out


def _shop_extract(repo: str, blob: str) -> dict:
    """Tech tree layouts: {branch: {nation: [[ [rank, [ids], group], ... ], ...]}}."""
    data = json.loads(_git(Path(repo), "cat-file", "blob", blob))
    out = {}
    for section, branch in SECTION_BRANCH.items():
        _, trees = parse_shop(data, section)
        out[branch] = {
            t.nation: [[[c.rank, c.units, c.group] for c in col] for col in t.columns]
            for t in trees
        }
    return out


EXTRACTORS = {WPCOST: _wpcost_extract, SHOP: _shop_extract}
# Bump a name when its extractor's output changes, so old cache entries aren't reused.
CACHE_NAMES = {WPCOST: "wpcost", SHOP: "shop-v3"}


def _extract_to_cache(args: tuple[str, str, str, str]) -> str:
    repo, path, blob, out = args
    result = EXTRACTORS[path](repo, blob)
    with gzip.open(out, "wt", encoding="utf-8") as f:
        json.dump(result, f, separators=(",", ":"))
    return blob


class BlobCache:
    """Extracted data per (file, blob), so each version is parsed once."""

    def __init__(self, root: Path):
        self.root = root

    def file(self, path: str, blob: str) -> Path:
        return self.root / CACHE_NAMES[path] / f"{blob}.json.gz"

    def load(self, path: str, blob: str):
        with gzip.open(self.file(path, blob), "rt", encoding="utf-8") as f:
            return json.load(f)

    def fill(self, hist: History, wanted: list[tuple[str, str]], workers: int = 4) -> int:
        missing = [(p, b) for p, b in dict.fromkeys(wanted) if not self.file(p, b).exists()]
        if not missing:
            return 0
        for p in {p for p, _ in missing}:
            self.file(p, "x").parent.mkdir(parents=True, exist_ok=True)
        hist.fetch_blobs([b for _, b in missing])
        jobs = [(str(hist.path), p, b, str(self.file(p, b))) for p, b in missing]
        with ProcessPoolExecutor(workers) as pool:
            for i, _ in enumerate(pool.map(_extract_to_cache, jobs), 1):
                if i % 50 == 0 or i == len(jobs):
                    print(f"  extracted {i}/{len(jobs)}", flush=True)
        return len(missing)


# --- timeline --------------------------------------------------------------------


@dataclass
class Point:
    """Game state at one live version: which wpcost and shop blobs were current."""

    version: str
    date: str
    commit: str
    wpcost: str
    shop: str | None


def timeline(commits: list[Commit]) -> list[Point]:
    """Live versions where wpcost or shop changed, oldest first. Same-version commits merge."""
    points: list[Point] = []
    wp: str | None = None
    shop: str | None = None
    for c in commits:
        if not c.live:
            continue
        if WPCOST not in c.blobs and SHOP not in c.blobs:
            continue
        wp = c.blobs.get(WPCOST, wp)
        shop = c.blobs.get(SHOP, shop)
        if wp is None:
            continue
        p = Point(c.version, c.date, c.sha, wp, shop)
        if points and points[-1].version == c.version:
            points[-1] = p
        else:
            points.append(p)
    return points


def pending_point(commits: list[Commit]) -> Point | None:
    """Game state at the newest pending (probable dev-server) build, if any."""
    if not commits or not commits[-1].pending:
        return None
    wp = shop = None
    for c in commits:
        wp = c.blobs.get(WPCOST, wp)
        shop = c.blobs.get(SHOP, shop)
    last = commits[-1]
    return Point(last.version, last.date, last.sha, wp, shop) if wp else None


def branch_of(row: list) -> str | None:
    """Branch of an extracted wpcost row, from its unitMoveType."""
    return MOVE_BRANCH.get(row[3])
