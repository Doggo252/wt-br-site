"""Turn the timeline of (wpcost, shop) snapshots into history outputs.

A vehicle is "in the game" at a version when it is in one of that version's
tech trees (shop.blkx) for its branch and has a wpcost entry. Test and tutorial
units that never appear in a tree are ignored.
"""

from dataclasses import dataclass, field

from .datamine import SHOP, WPCOST
from .history import BlobCache, Point, branch_of


def major_of(version: str) -> str:
    return ".".join(version.split(".")[:2])


@dataclass
class UnitHistory:
    branch: str
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
    layoutChanged: list[tuple[str, str]] = field(default_factory=list)  # (branch, nation)


@dataclass
class HistoryResult:
    versions: list[Version]
    units: dict[str, UnitHistory]
    # (branch, nation) -> list of (vIdx, layout); layout is [[ [rank, [ids], group], ...], ...]
    layouts: dict[tuple[str, str], list[tuple[int, list]]]


def state_at(cache: BlobCache, p: Point):
    """(wpcost rows, shop layouts, uid -> (branch, nation), uid -> ranks of units in the game)."""
    wp = cache.load(WPCOST, p.wpcost)
    shop = cache.load(SHOP, p.shop) if p.shop else {}
    in_tree = {
        uid: (branch, nation)
        for branch, trees in shop.items()
        for nation, cols in trees.items()
        for col in cols
        for _, ids, _ in col
        for uid in ids
    }
    present = {
        uid: (row[0], row[1], row[2])
        for uid, row in wp.items()
        if uid in in_tree and branch_of(row) == in_tree[uid][0]
    }
    return wp, shop, in_tree, present


def diff_states(cache: BlobCache, base: Point, new: Point) -> tuple[list[dict], list[str], dict]:
    """BR changes and additions from `base` to `new`, plus (branch, nation) of added units."""
    _, _, _, before = state_at(cache, base)
    _, _, in_tree, after = state_at(cache, new)
    changes = [
        {"id": u, "from": list(before[u]), "to": list(br)}
        for u, br in after.items()
        if u in before and before[u] != br
    ]
    added = [u for u in after if u not in before]
    return changes, added, {u: in_tree[u] for u in added}


def build_history(points: list[Point], cache: BlobCache) -> HistoryResult:
    versions: list[Version] = []
    units: dict[str, UnitHistory] = {}
    layouts: dict[tuple[str, str], list[tuple[int, list]]] = {}

    prev_present: dict[str, tuple[int, int, int]] = {}
    prev_layout: dict[tuple[str, str], list] = {}

    for p in points:
        wp, shop, in_tree, present = state_at(cache, p)

        v = Version(p.version, p.date, p.commit)
        for uid, br in present.items():
            old = prev_present.get(uid)
            if old is None:
                v.added.append(uid)
            elif old != br:
                v.changes.append({"id": uid, "from": list(old), "to": list(br)})
        v.removed = [uid for uid in prev_present if uid not in present]

        layout = {
            (branch, nation): [[c for c in col if any(u in present for u in c[1])] for col in cols]
            for branch, trees in shop.items()
            for nation, cols in trees.items()
        }
        v.layoutChanged = [k for k, cols in layout.items() if prev_layout.get(k) != cols]

        if v.changes or v.added or v.removed or v.layoutChanged or not versions:
            idx = len(versions)
            versions.append(v)
            for uid in v.added:
                branch, nation = in_tree[uid]
                h = units.setdefault(uid, UnitHistory(branch, nation, wp[uid][5]))
                if h.removed and h.removed[-1][1] == -1:
                    h.removed[-1] = (h.removed[-1][0], idx)
                h.points.append((idx, *present[uid]))
            for c in v.changes:
                units[c["id"]].points.append((idx, *c["to"]))
            for uid in v.removed:
                units[uid].removed.append((idx, -1))
            for k in v.layoutChanged:
                layouts.setdefault(k, []).append((idx, layout[k]))
            for uid in present:
                units[uid].branch, units[uid].nation = in_tree[uid]
                units[uid].tier = wp[uid][5]

        prev_present = present
        prev_layout = layout

    return HistoryResult(versions, units, layouts)
