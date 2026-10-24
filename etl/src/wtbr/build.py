"""Build data/ for the current game version."""

import json
import shutil
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel

from . import parse
from .datamine import SHOP, UNITS_CSV, UNITTAGS, WEAPONRY_CSV, WPCOST, Datamine
from .models import Meta, NationTree, Ranks, Sight, Stats, TreeCell, UnitDetail, UnitSummary

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


def build_current(dm: Datamine, out: Path, images: Path | None = None) -> Meta:
    wpcost = dm.read_json(WPCOST)
    shop_units, shop_trees = parse.parse_shop(dm.read_json(SHOP))
    unittags = dm.read_json(UNITTAGS)
    lang = parse.parse_lang(dm.read_text(UNITS_CSV))
    weaponry = parse.parse_weaponry(dm.read_text(WEAPONRY_CSV))
    ranks = parse.ground_ranks(wpcost)

    summaries: list[UnitSummary] = []
    details: list[UnitDetail] = []
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
        summaries.append(UnitSummary(**base))
        details.append(
            UnitDetail(
                **base,
                fullName=lang.get(f"{uid}_0") or base["name"],
                sights={c: [Sight(**s) for s in ss] for c, ss in sights.items()},
                stats=Stats(**parse.parse_stats(model, wp, unittags.get(uid) or {}, weaponry)),
                eventName=su.flags.get("event") or wp.get("event"),
            )
        )

    known = {s.id for s in summaries}
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
    )

    if out.exists():
        for sub in ("units", "trees"):
            shutil.rmtree(out / sub, ignore_errors=True)
    _write(out / "meta.json", meta)
    _write(out / "units" / "index.json", sorted(summaries, key=lambda s: s.id))
    for d in details:
        _write(out / "units" / f"{d.id}.json", d)
    for t in trees:
        _write(out / "trees" / f"{t.nation}.json", t)
    return meta


def _write(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(obj, list):
        data = [o.model_dump(mode="json", exclude_defaults=True) for o in obj]
    elif isinstance(obj, BaseModel):
        data = obj.model_dump(mode="json", exclude_defaults=True)
    else:
        data = obj
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
