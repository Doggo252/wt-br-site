"""Turn the timeline of (wpcost, shop) snapshots into history outputs.

A ground vehicle is "in the game" at a version when it is in that version's
ground tech tree (shop.blkx) and has a wpcost entry. Test and tutorial units
that never appear in a tree are ignored.
"""

from dataclasses import dataclass, field

from .datamine import SHOP, WPCOST
from .history import BlobCache, Point, is_ground


def major_of(version: str) -> str:
    return ".".join(version.split(".")[:2])


@dataclass
class UnitHistory:
    nation: str
    tier: int
    points: list[tuple[int, int, int, int]] = field(default_factory=list)  # (vIdx, ab, rb, sb)
    removed: list[tuple[int, int]] = field(default_factory=list)  # (from vIdx, back vIdx or -1)


@dataclass
class Version:
    version: str
    date: str
    commit: str
    changes: list[dict] = field(default_factory=list)  # {id, from: [ab,rb,sb], to: [...]}
    added: list[str] = field(default_factory=list)
    removed: list[str] = field(default_factory=list)
    layoutChanged: list[str] = field(default_factory=list)  # nations


@dataclass
class HistoryResult:
    versions: list[Version]
    units: dict[str, UnitHistory]
    # nation -> list of (vIdx, layout) where layout is [[ [rank, [ids], group], ...], ...]
    layouts: dict[str, list[tuple[int, list]]]


def build_history(points: list[Point], cache: BlobCache) -> HistoryResult:
    versions: list[Version] = []
    units: dict[str, UnitHistory] = {}
    layouts: dict[str, list[tuple[int, list]]] = {}

    prev_present: dict[str, tuple[int, int, int]] = {}
    prev_layout: dict[str, list] = {}

    for p in points:
        wp = cache.load(WPCOST, p.wpcost)
        shop = cache.load(SHOP, p.shop) if p.shop else {}
        in_tree = {
            uid: nation
            for nation, cols in shop.items()
            for col in cols
            for _, ids, _ in col
            for uid in ids
        }
        present = {
            uid: (row[0], row[1], row[2])
            for uid, row in wp.items()
            if is_ground(row) and uid in in_tree
        }

        v = Version(p.version, p.date, p.commit)
        for uid, br in present.items():
            old = prev_present.get(uid)
            if old is None:
                v.added.append(uid)
            elif old != br:
                v.changes.append({"id": uid, "from": list(old), "to": list(br)})
        v.removed = [uid for uid in prev_present if uid not in present]

        ground_layout = {
            nation: [[c for c in col if any(u in present for u in c[1])] for col in cols]
            for nation, cols in shop.items()
        }
        v.layoutChanged = [n for n, cols in ground_layout.items() if prev_layout.get(n) != cols]

        if v.changes or v.added or v.removed or v.layoutChanged or not versions:
            idx = len(versions)
            versions.append(v)
            for uid in v.added:
                row = wp[uid]
                h = units.setdefault(uid, UnitHistory(in_tree[uid], row[5]))
                if h.removed and h.removed[-1][1] == -1:
                    h.removed[-1] = (h.removed[-1][0], idx)
                h.points.append((idx, *present[uid]))
            for c in v.changes:
                units[c["id"]].points.append((idx, *c["to"]))
            for uid in v.removed:
                units[uid].removed.append((idx, -1))
            for n in v.layoutChanged:
                layouts.setdefault(n, []).append((idx, ground_layout[n]))
            for uid in present:
                units[uid].nation = in_tree[uid]
                units[uid].tier = wp[uid][5]

        prev_present = present
        prev_layout = ground_layout

    return HistoryResult(versions, units, layouts)
