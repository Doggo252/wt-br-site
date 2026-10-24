from wtbr.datamine import SHOP, WPCOST
from wtbr.history import Commit, Point, pending_point, timeline
from wtbr.history_build import build_history, diff_states


class FakeCache:
    """Stands in for BlobCache: blob ids map straight to extracted data."""

    def __init__(self, blobs: dict):
        self.blobs = blobs

    def load(self, path, blob):
        return self.blobs[blob]


def wp(**units):
    """wpcost rows: name=(ab, rb, sb, moveType)."""
    return {u: [ab, rb, sb, mt, "germany", 3] for u, (ab, rb, sb, mt) in units.items()}


def shop(ground=(), air=()):
    tree = lambda ids: {"germany": [[[3, [u], None] for u in ids]]} if ids else {}  # noqa: E731
    return {"ground": tree(ground), "air": tree(air), "heli": {}}


def point(i, wpcost, shop_blob):
    return Point(f"2.{i}.0.1", f"2026-0{i}-01T00:00:00+00:00", f"c{i}", wpcost, shop_blob)


def test_history_changes_removal_return_and_branches():
    cache = FakeCache(
        {
            "w1": wp(
                tiger=(14, 14, 14, "heavy_tank"), p51=(9, 9, 12, "air"), dummy=(0, 0, 0, "tank")
            ),
            "w2": wp(
                tiger=(15, 15, 14, "heavy_tank"), p51=(9, 9, 12, "air"), dummy=(0, 0, 0, "tank")
            ),
            "w3": wp(tiger=(15, 15, 14, "heavy_tank"), p51=(9, 8, 12, "air")),
            "s1": shop(ground=["tiger"], air=["p51"]),
            "s3": shop(ground=[], air=["p51"]),
        }
    )
    points = [
        point(1, "w1", "s1"),
        point(2, "w2", "s1"),  # tiger uptiered in AB/RB
        point(3, "w3", "s3"),  # tiger removed from the tree, p51 RB down
        point(4, "w2", "s1"),  # tiger back
    ]
    r = build_history(points, cache)

    # "dummy" has a wpcost entry but is never in a tree, so it is ignored.
    assert set(r.units) == {"tiger", "p51"}
    assert r.units["tiger"].branch == "ground" and r.units["p51"].branch == "air"
    assert [v.version for v in r.versions] == ["2.1.0.1", "2.2.0.1", "2.3.0.1", "2.4.0.1"]
    assert r.versions[1].changes == [{"id": "tiger", "from": [14, 14, 14], "to": [15, 15, 14]}]
    assert r.versions[2].removed == ["tiger"]
    assert r.versions[3].added == ["tiger"]
    tiger = r.units["tiger"]
    assert [p[0] for p in tiger.points] == [0, 1, 3]
    assert tiger.removed == [(2, 3)]  # removed at version 2, back at 3
    assert ("ground", "germany") in r.layouts and ("air", "germany") in r.layouts


def test_unchanged_versions_are_skipped():
    cache = FakeCache({"w": wp(tiger=(14, 14, 14, "heavy_tank")), "s": shop(ground=["tiger"])})
    r = build_history([point(1, "w", "s"), point(2, "w", "s")], cache)
    assert len(r.versions) == 1


def test_diff_states_for_dev_preview():
    cache = FakeCache(
        {
            "live": wp(tiger=(14, 14, 14, "heavy_tank")),
            "dev": wp(tiger=(15, 15, 15, "heavy_tank"), leo=(36, 36, 36, "tank")),
            "s_live": shop(ground=["tiger"]),
            "s_dev": shop(ground=["tiger", "leo"]),
        }
    )
    changes, added, where = diff_states(cache, point(1, "live", "s_live"), point(2, "dev", "s_dev"))
    assert changes == [{"id": "tiger", "from": [14, 14, 14], "to": [15, 15, 15]}]
    assert added == ["leo"] and where == {"leo": ("ground", "germany")}


def test_timeline_skips_dev_and_merges_same_version():
    commits = [
        Commit("a", "2026-01-01T00:00:00+00:00", "2.1.0.1", True, {WPCOST: "w1", SHOP: "s1"}),
        Commit("b", "2026-01-02T00:00:00+00:00", "2.2.0.1", False, {WPCOST: "wdev"}),
        Commit("c", "2026-01-03T00:00:00+00:00", "2.1.0.2", True, {WPCOST: "w2"}),
        Commit("d", "2026-01-04T00:00:00+00:00", "2.1.0.2", True, {WPCOST: "w3"}),
    ]
    tl = timeline(commits)
    assert [(p.version, p.wpcost, p.shop) for p in tl] == [
        ("2.1.0.1", "w1", "s1"),
        ("2.1.0.2", "w3", "s1"),
    ]
    assert pending_point(commits) is None
    commits.append(
        Commit("e", "2026-01-05T00:00:00+00:00", "2.2.0.5", False, {WPCOST: "wdev2"}, pending=True)
    )
    p = pending_point(commits)
    assert p.version == "2.2.0.5" and p.wpcost == "wdev2" and p.shop == "s1"
