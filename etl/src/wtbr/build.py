"""Build data/: current vehicles, plus BR history when a HistoryResult is given."""

import json
import os
import shutil
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel

from . import parse, paths, records
from .datamine import SHOP, UNITS_CSV, UNITTAGS, WEAPONRY_CSV, WPCOST, Datamine
from .history_build import HistoryResult, major_of
from .models import (
    Absence,
    BrChange,
    HistoryPoint,
    Meta,
    NationTree,
    Ranks,
    RecordRow,
    Sight,
    Stats,
    TimeMachine,
    TimeMachineUnit,
    TreeCell,
    UnitDetail,
    UnitRecord,
    UnitSummary,
    UpdateDiff,
    VersionInfo,
)

# In-game nation order.
NATION_ORDER = [
    "usa", "germany", "ussr", "britain", "japan", "china", "italy", "france", "sweden", "israel",
]  # fmt: skip


def status_of(wp: dict, shop_flags: dict) -> str:
    if shop_flags.get("isClanVehicle") or wp.get("researchType") == "clanVehicle":
        return "squadron"
    if shop_flags.get("event") or wp.get("event") or shop_flags.get("marketplaceItemdefId"):
        return "event"
    if wp.get("costGold") or wp.get("gift") or shop_flags.get("gift"):
        return "premium"
    return "tree"


def is_hidden(wp: dict, shop_flags: dict) -> bool:
    keys = ("showOnlyWhenBought", "hideFeature", "showOnlyWhenAvailableForPurchase")
    return any(shop_flags.get(k) or wp.get(k) for k in keys)


def build_current(
    dm: Datamine,
    out: Path,
    images: Path | None = None,
    hist: HistoryResult | None = None,
    record_rows: list | None = None,
) -> Meta:
    wpcost = dm.read_json(WPCOST)
    shop_units, shop_trees = parse.parse_shop(dm.read_json(SHOP))
    unittags = dm.read_json(UNITTAGS)
    lang = parse.parse_lang(dm.read_text(UNITS_CSV))
    weaponry = parse.parse_weaponry(dm.read_text(WEAPONRY_CSV))
    ranks = parse.ground_ranks(wpcost)

    details: dict[str, UnitDetail] = {}
    for uid, su in shop_units.items():
        if uid not in ranks:
            continue
        wp = wpcost[uid]
        tags = (unittags.get(uid) or {}).get("tags") or {}
        model = dm.tankmodel(uid) or {}
        sights = parse.parse_sights(model)
        image = bool(images and (images / f"{uid}.webp").exists())
        base = dict(
            id=uid,
            branch="ground",
            nation=su.nation,
            operator=parse.operator_country(tags, su.nation),
            rank=su.rank,
            type=parse.unit_type(tags),
            name=lang.get(f"{uid}_shop") or lang.get(f"{uid}_0") or uid,
            status=status_of(wp, su.flags),
            hidden=is_hidden(wp, su.flags),
            br=Ranks(**ranks[uid]),
            thermal=parse.best_thermal(sights),
            image=image,
        )
        details[uid] = UnitDetail(
            **base,
            fullName=lang.get(f"{uid}_0") or base["name"],
            sights={c: [Sight(**s) for s in ss] for c, ss in sights.items()},
            stats=Stats(**parse.parse_stats(model, wp, unittags.get(uid) or {}, weaponry)),
            eventName=su.flags.get("event") or wp.get("event"),
        )

    if hist:
        _drop_event_units(hist, details, lang)
        _add_removed_units(details, hist, wpcost, unittags, lang, images)
        _attach_history(details, hist)

    if record_rows is not None:
        _attach_records(details, record_rows, lang)

    summaries = [
        UnitSummary(**d.model_dump(include=set(UnitSummary.model_fields))) for d in details.values()
    ]
    known = {uid for uid, d in details.items() if not d.removedIn}
    trees = []
    for t in shop_trees:
        cols = []
        for col in t.columns:
            cells = [
                TreeCell(
                    rank=c.rank,
                    units=[u for u in c.units if u in known],
                    group=c.group,
                    groupName=lang.get(f"shop/group/{c.group}") if c.group else None,
                )
                for c in col
            ]
            cols.append([c for c in cells if c.units])
        trees.append(NationTree(nation=t.nation, branch="ground", columns=cols))

    nations = [n for n in NATION_ORDER if any(t.nation == n for t in trees)]
    nations += sorted({t.nation for t in trees} - set(nations))
    meta = Meta(
        version=dm.version,
        commit=dm.commit,
        date=dm.commit_date,
        generatedAt=datetime.now(UTC).isoformat(timespec="seconds"),
        unitCount=len(summaries),
        nations=nations,
        perNation={
            n: sum(1 for d in details.values() if d.nation == n and not d.removedIn)
            for n in nations
        },
    )
    validate(meta, out / "meta.json", details)

    if out.exists():
        for sub in ("units", "trees", "updates", "public"):
            shutil.rmtree(out / sub, ignore_errors=True)
    _write(out / "meta.json", meta)
    _write(out / "units" / "index.json", sorted(summaries, key=lambda s: s.id))
    for d in details.values():
        _write(out / "units" / f"{d.id}.json", d)
    for t in trees:
        _write(out / "trees" / f"{t.nation}.json", t)
    # Client-side search: [id, name, nation, rb rank, removed?]
    search = [
        [s.id, s.name, s.nation, s.br.rb, 1 if s.removedIn else 0]
        for s in sorted(summaries, key=lambda s: s.name.lower())
    ]
    _write(out / "public" / "search.json", search)
    if hist:
        _write_history(out, hist, details, lang)
    if record_rows is not None:
        rows = [
            RecordRow(
                nation=r.nation, name=r.name, id=r.id, kills=r.kills, player=r.player,
                br=r.br, patch=r.patch,
            )
            for r in record_rows
        ]  # fmt: skip
        _write(out / "records.json", rows)
    return meta


TRANSIENT_DAYS = 120


def _drop_event_units(hist: HistoryResult, details: dict, lang: dict) -> None:
    """Remove units that are gone now and were only temporary: April Fools and other event-mode
    vehicles that briefly sat in a tree. Kept if still in the game or around for months."""
    vs = hist.versions
    drop = set()
    for uid, h in hist.units.items():
        if uid in details or not h.removed or h.removed[-1][1] != -1:
            continue
        start = datetime.fromisoformat(vs[h.points[0][0]].date)
        end = datetime.fromisoformat(vs[h.removed[-1][0]].date)
        unnamed = not (lang.get(f"{uid}_shop") or lang.get(f"{uid}_0"))
        if unnamed or (end - start).days < TRANSIENT_DAYS:
            drop.add(uid)
    for uid in drop:
        del hist.units[uid]
    for v in vs:
        v.added = [u for u in v.added if u not in drop]
        v.removed = [u for u in v.removed if u not in drop]
        v.changes = [c for c in v.changes if c["id"] not in drop]


class ValidationError(RuntimeError):
    pass


MAX_NATION_DROP = 0.05


def validate(meta: Meta, previous: Path, details: dict[str, UnitDetail]) -> None:
    """Refuse to overwrite good data with obviously broken data (e.g. a datamine format change).
    Set WTBR_SKIP_VALIDATION=1 to override after checking the cause."""
    problems = []
    for uid, d in details.items():
        if not d.name or d.rank < 1:
            problems.append(f"{uid}: missing name or tier")
        if min(d.br.ab, d.br.rb, d.br.sb) < 0:
            problems.append(f"{uid}: negative economic rank")
        if d.history and [h.v for h in d.history] != sorted(
            (h.v for h in d.history), key=lambda v: tuple(int(x) for x in v.split("."))
        ):
            problems.append(f"{uid}: history out of order")
    if previous.exists():
        old = json.loads(previous.read_text())
        for nation, count in old.get("perNation", {}).items():
            new = meta.perNation.get(nation, 0)
            if new < count * (1 - MAX_NATION_DROP):
                problems.append(f"{nation}: {count} -> {new} vehicles (more than a 5% drop)")
    if problems and not os.environ.get("WTBR_SKIP_VALIDATION"):
        raise ValidationError("data validation failed:\n  " + "\n  ".join(problems[:50]))


def _attach_records(details: dict[str, UnitDetail], rows: list, lang: dict) -> None:
    """Match sheet rows to vehicles (records.match), then attach the best record per vehicle."""
    cands = [
        records.Candidate(
            d.id, d.nation, [lang.get(f"{d.id}{s}") for s in ("_shop", "_0", "_1")], d.br.rb
        )
        for d in details.values()
    ]
    overrides = records.load_overrides(paths.MANUAL / "records.toml")
    unknown = sorted({v for v in overrides.values() if v and v not in details})
    if unknown:
        raise ValueError(f"records.toml points at unknown vehicle ids: {unknown}")
    records.match(rows, cands, overrides)
    unmatched = [r for r in rows if not r.id]
    if unmatched:
        print(f"records: {len(unmatched)} sheet rows not matched to a vehicle:")
        for r in unmatched:
            print(f"  [{r.nation}] {r.name!r} (BR {r.br})")
    for r in rows:
        if r.id and r.kills:
            d = details[r.id]
            if d.record is None or r.kills > d.record.kills:
                d.record = UnitRecord(kills=r.kills, player=r.player, patch=r.patch)
                d.recordKills = r.kills
    matched = sum(1 for r in rows if r.id)
    print(f"records: {len(rows)} rows, {matched} matched ({matched / max(len(rows), 1):.1%})")


def _add_removed_units(details, hist: HistoryResult, wpcost, unittags, lang, images) -> None:
    """Vehicles that were in a tech tree at some point but aren't now."""
    for uid, h in hist.units.items():
        if uid in details:
            continue
        tags = (unittags.get(uid) or {}).get("tags") or {}
        wp = wpcost.get(uid) if isinstance(wpcost.get(uid), dict) else {}
        last = h.points[-1]
        name = lang.get(f"{uid}_shop") or lang.get(f"{uid}_0") or uid
        details[uid] = UnitDetail(
            id=uid,
            branch="ground",
            nation=h.nation,
            operator=parse.operator_country(tags, h.nation),
            rank=h.tier or 1,
            type=parse.unit_type(tags),
            name=name,
            fullName=lang.get(f"{uid}_0") or name,
            status=status_of(wp, {}),
            hidden=True,
            br=Ranks(ab=last[1], rb=last[2], sb=last[3]),
            image=bool(images and (images / f"{uid}.webp").exists()),
        )


def _attach_history(details: dict[str, UnitDetail], hist: HistoryResult) -> None:
    vs = hist.versions
    for uid, h in hist.units.items():
        d = details[uid]
        d.history = [
            HistoryPoint(v=vs[i].version, d=vs[i].date[:10], ab=ab, rb=rb, sb=sb)
            for i, ab, rb, sb in h.points
        ]
        d.added = vs[h.points[0][0]].version if h.points[0][0] > 0 else None
        d.changes = sum(1 for a, b in zip(h.points, h.points[1:], strict=False) if a[1:] != b[1:])
        d.absences = [
            Absence(removed=vs[a].version, returned=vs[b].version if b >= 0 else None)
            for a, b in h.removed
        ]
        if h.removed and h.removed[-1][1] == -1:
            d.removedIn = vs[h.removed[-1][0]].version


def _write_history(out: Path, hist: HistoryResult, details: dict[str, UnitDetail], lang) -> None:
    vs = hist.versions
    infos = []
    for i, v in enumerate(vs):
        infos.append(
            VersionInfo(
                v=v.version,
                d=v.date[:10],
                major=major_of(v.version),
                changes=len(v.changes),
                up=sum(1 for c in v.changes if c["to"][1] > c["from"][1]),
                down=sum(1 for c in v.changes if c["to"][1] < c["from"][1]),
                added=len(v.added) if i > 0 else 0,
                removed=len(v.removed),
            )
        )
        diff = UpdateDiff(
            v=v.version,
            d=v.date[:10],
            prev=vs[i - 1].version if i > 0 else None,
            next=vs[i + 1].version if i + 1 < len(vs) else None,
            changes=[
                BrChange(id=c["id"], before=Ranks(**_r(c["from"])), after=Ranks(**_r(c["to"])))
                for c in v.changes
            ],
            added=v.added if i > 0 else [],
            removed=v.removed,
        )
        _write(out / "updates" / f"{v.version}.json", diff)
    _write(out / "versions.json", infos)
    # The slider needs the version list client-side too.
    _write(out / "public" / "versions.json", infos)

    for nation, layouts in hist.layouts.items():
        ids = {u for _, cols in layouts for col in cols for _, us, _ in col for u in us}
        tm = TimeMachine(
            nation=nation,
            layouts=[
                (
                    i,
                    [
                        [
                            TreeCell(
                                rank=r,
                                units=[u for u in us if u in hist.units],
                                group=g,
                                groupName=lang.get(f"shop/group/{g}") if g else None,
                            )
                            for r, us, g in col
                        ]
                        for col in cols
                    ],
                )
                for i, cols in layouts
            ],
            units={
                u: TimeMachineUnit(
                    n=details[u].name,
                    s=details[u].status,
                    i=details[u].image,
                    h=hist.units[u].points,
                )
                for u in sorted(ids)
                if u in hist.units
            },
        )
        _write(out / "public" / "timemachine" / f"{nation}.json", tm)


def _r(x: list[int]) -> dict[str, int]:
    return {"ab": x[0], "rb": x[1], "sb": x[2]}


def _write(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(obj, list) and obj and isinstance(obj[0], BaseModel):
        data = [o.model_dump(mode="json", exclude_defaults=True) for o in obj]
    elif isinstance(obj, BaseModel):
        data = obj.model_dump(mode="json", exclude_defaults=True)
    else:
        data = obj
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
