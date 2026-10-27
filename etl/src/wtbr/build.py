"""Build data/: current vehicles, plus BR history when a HistoryResult is given."""

import json
import os
import re
import shutil
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel

from . import ammo, market, official, parse, patchnotes, paths, records, store
from .datamine import (
    EXPLOSIVE,
    MODIFICATIONS_CSV,
    RANK,
    SHOP,
    UNITS_CSV,
    UNITTAGS,
    WEAPONRY_CSV,
    WPCOST,
    Datamine,
)
from .history_build import HistoryResult, major_of
from .models import (
    Absence,
    Announcement,
    BranchCounts,
    BrChange,
    DevPreview,
    DevUnit,
    Economy,
    Gun,
    HistoryPoint,
    MarketData,
    MarketEntry,
    MarketPoint,
    MarketQuote,
    Meta,
    Modification,
    NationTree,
    OfficialChange,
    PatchMention,
    PatchNote,
    PatchNoteItem,
    PatchNoteSection,
    PatchNoteSummary,
    Ranks,
    RecordRow,
    ResearchRules,
    Sight,
    Stats,
    StoreData,
    StorePack,
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


# Gaijin Market item names, from links players shared:
#   newer: id50381_f_16xl_usa, id50373_scimitar_mk_2_great_britain (shop name + nation)
#   older: "AMX 50 Surblindé (France)" (display name, hyphens as spaces)
#   also:  "items_Heavy Tank No.6 (Japan)", not generated yet
# A best guess until the market's own item list replaces it; the switch point is a guess
# from the samples (50068 old, 50160 new).
MARKET_NEW_FROM = 50100
MARKET_NATION = {
    "usa": ("usa", "USA"), "germany": ("germany", "Germany"), "ussr": ("ussr", "USSR"),
    "britain": ("great_britain", "Great Britain"), "japan": ("japan", "Japan"),
    "china": ("china", "China"),
    "italy": ("italy", "Italy"), "france": ("france", "France"), "sweden": ("sweden", "Sweden"),
    "israel": ("israel", "Israel"),
}  # fmt: skip


def market_name(item_id: int | None, name: str, nation: str) -> str | None:
    if not item_id or nation not in MARKET_NATION:
        return None
    from .records import GLYPHS

    plain = GLYPHS.sub("", name).strip()
    slug_nation, display_nation = MARKET_NATION[nation]
    if item_id < MARKET_NEW_FROM:
        return f"{plain.replace('-', ' ')} ({display_nation})"
    slug = re.sub(r"[^a-z0-9]+", "_", plain.lower()).strip("_")
    return f"id{item_id}_{slug}_{slug_nation}"


def status_of(wp: dict, shop_flags: dict, uid: str = "") -> str:
    if shop_flags.get("isClanVehicle") or wp.get("researchType") == "clanVehicle":
        return "squadron"
    if shop_flags.get("event") or wp.get("event") or shop_flags.get("marketplaceItemdefId"):
        return "event"
    # Copies made for event game modes ("germ_a7v_event") carry no shop flags of their own.
    if uid.endswith("_event"):
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
    dev: tuple | None = None,
    announcements: list[dict] | None = None,
) -> Meta:
    wpcost = dm.read_json(WPCOST)
    shop = dm.read_json(SHOP)
    unittags = dm.read_json(UNITTAGS)
    lang = parse.parse_lang(dm.read_text(UNITS_CSV))
    weaponry_csv = dm.read_text(WEAPONRY_CSV)
    weaponry = parse.parse_weaponry(weaponry_csv)
    try:
        mod_names = parse.parse_mod_names(dm.read_text(MODIFICATIONS_CSV))
    except FileNotFoundError:  # older sparse checkouts; `wtbr fetch` adds the file
        mod_names = {}
    try:
        explosives = ammo.Explosives.parse(dm.read_json(EXPLOSIVE))
    except FileNotFoundError:
        explosives = ammo.Explosives({}, [])
    bullet_names = parse.parse_bullet_names(weaponry_csv)

    def arsenal(model: dict, wp: dict) -> list[Gun]:
        return ammo.guns(model, wp, dm.weapon, bullet_names, explosives, weaponry)

    details: dict[str, UnitDetail] = {}
    shop_trees: list[tuple[str, parse.ShopTree]] = []
    all_shop_units: dict[str, parse.ShopUnit] = {}
    for branch, (section, move_types) in parse.BRANCHES.items():
        shop_units, trees = parse.parse_shop(shop, section)
        shop_trees += [(branch, t) for t in trees]
        all_shop_units.update(shop_units)
        ranks = parse.unit_ranks(wpcost, move_types)
        for uid, su in shop_units.items():
            if uid not in ranks or uid in details:
                continue
            details[uid] = _current_unit(
                dm, uid, branch, su, wpcost[uid], ranks[uid], unittags, lang, weaponry, images,
                arsenal,
            )  # fmt: skip
            details[uid].economy = Economy(**parse.parse_economy(wpcost[uid]))
            details[uid].modifications = [
                Modification(**m) for m in parse.parse_modifications(wpcost[uid], mod_names)
            ]
            _name_ammo_packs(details[uid], wpcost[uid])

    if hist:
        _drop_event_units(hist, details, lang)
        _add_removed_units(details, hist, wpcost, unittags, lang, images)
        _attach_history(details, hist)

    if record_rows is not None:
        _attach_records(details, record_rows, lang)
    researchable = {
        uid for uid, d in details.items() if d.status == "tree" and not d.hidden and not d.removedIn
    }
    for uid, req in parse.requirements(
        [t for _, t in shop_trees], all_shop_units, researchable
    ).items():
        details[uid].requires = req
    market_data = _attach_market(details, paths.MANUAL / "market")
    store_data = _attach_store(details, paths.CACHE / "store")
    notes = _patch_notes(
        details,
        patchnotes.load(paths.CACHE / "patchnotes"),
        [(v.version, v.date[:10]) for v in hist.versions] if hist else [],
    )

    summaries = [
        UnitSummary(**d.model_dump(include=set(UnitSummary.model_fields))) for d in details.values()
    ]
    known = {uid for uid, d in details.items() if not d.removedIn}
    trees = []
    for branch, t in shop_trees:
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
        if any(cols):
            trees.append(NationTree(nation=t.nation, branch=branch, columns=cols))

    branches = {}
    for branch in parse.BRANCHES:
        have = {t.nation for t in trees if t.branch == branch}
        branches[branch] = [n for n in NATION_ORDER if n in have] + sorted(have - set(NATION_ORDER))
    meta = Meta(
        version=dm.version,
        commit=dm.commit,
        date=dm.commit_date,
        generatedAt=datetime.now(UTC).isoformat(timespec="seconds"),
        unitCount=len(summaries),
        branches=branches,
        perNation={
            f"{b}/{n}": sum(
                1 for d in details.values() if d.branch == b and d.nation == n and not d.removedIn
            )
            for b, nations in branches.items()
            for n in nations
        },
    )
    validate(meta, out / "meta.json", details)

    if out.exists():
        for sub in ("units", "trees", "updates", "public", "patchnotes"):
            shutil.rmtree(out / sub, ignore_errors=True)
    _write(out / "meta.json", meta)
    _write(out / "units" / "index.json", sorted(summaries, key=lambda s: s.id))
    for d in details.values():
        _write(out / "units" / f"{d.id}.json", d)
    for t in trees:
        _write(out / "trees" / t.branch / f"{t.nation}.json", t)
    # Client-side search: [id, name, nation, rb rank, removed?, branch]
    search = [
        [s.id, s.name, s.nation, s.br.rb, 1 if s.removedIn else 0, s.branch]
        for s in sorted(summaries, key=lambda s: s.name.lower())
    ]
    _write(out / "public" / "search.json", search)
    if hist:
        _write_history(out, hist, details, lang)
    if announcements is not None:
        _write(out / "official.json", _official(announcements, details, lang, meta.date[:10]))
    if dev:
        _write(out / "dev.json", _dev_preview(dev, lang))
    else:
        (out / "dev.json").unlink(missing_ok=True)
    if market_data:
        _write(out / "market.json", market_data)
    if store_data:
        _write(out / "store.json", store_data)
    try:
        _write(out / "research.json", ResearchRules(unlocks=parse.rank_unlocks(dm.read_json(RANK))))
    except FileNotFoundError:  # older sparse checkouts; `wtbr fetch` adds rank.blkx
        pass
    if notes:
        _write(
            out / "patchnotes" / "index.json",
            [
                PatchNoteSummary(**n.model_dump(include=set(PatchNoteSummary.model_fields)))
                for n in notes
            ],
        )
        for n in notes:
            _write(out / "patchnotes" / f"{n.id}.json", n)
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


def _ge_cost(wp: dict, flags: dict, uid: str) -> int | None:
    """Golden Eagle price of a premium sold in game. Store-pack vehicles (`gift` in shop.blkx)
    carry a costGold too, but it isn't offered."""
    if status_of(wp, flags, uid) != "premium" or flags.get("gift"):
        return None
    return wp.get("costGold") or None


def _name_ammo_packs(d: UnitDetail, wp: dict) -> None:
    """Ammo research steps have no names of their own ("120mm DM APDS FS ammo pack"); call them
    after the shells they unlock ("DM53 (APFSDS)")."""
    mods = wp.get("modifications") or {}
    packs: dict[str, str] = {}
    for gun in d.guns:
        for opt in gun.ammo:
            pack = (mods.get(opt.mod) or {}).get("reqModification") if opt.mod else None
            if pack:
                packs[pack] = ", ".join(f"{r.name} ({r.type})" for r in opt.rounds)
    for m in d.modifications:
        if m.id in packs and m.name == m.id.replace("_", " "):
            m.name = packs[m.id]


def _current_unit(
    dm, uid, branch, su, wp, ranks, unittags, lang, weaponry, images, arsenal
) -> UnitDetail:
    unittag = unittags.get(uid) or {}
    tags = unittag.get("tags") or {}
    name = lang.get(f"{uid}_shop") or lang.get(f"{uid}_0") or uid
    guns: list[Gun] = []
    if branch == "ground":
        model = dm.tankmodel(uid) or {}
        sights = parse.parse_sights(model)
        stats = parse.parse_stats(model, wp, unittag, weaponry)
        guns = arsenal(model, wp)
    else:
        sights = {}
        stats = parse.parse_air_stats(unittag, wp)
    return UnitDetail(
        id=uid,
        branch=branch,
        nation=su.nation,
        operator=parse.operator_country(tags, su.nation),
        rank=su.rank,
        type=parse.unit_type(tags, wp),
        name=name,
        fullName=lang.get(f"{uid}_0") or name,
        status=status_of(wp, su.flags, uid),
        hidden=is_hidden(wp, su.flags),
        br=Ranks(**ranks),
        thermal=parse.best_thermal(sights),
        image=bool(images and (images / f"{uid}.webp").exists()),
        sights={c: [Sight(**x) for x in ss] for c, ss in sights.items()},
        stats=Stats(**stats),
        eventName=su.flags.get("event") or wp.get("event"),
        marketItemId=su.flags.get("marketplaceItemdefId"),
        marketName=market_name(su.flags.get("marketplaceItemdefId"), name, su.nation),
        geCost=_ge_cost(wp, su.flags, uid),
        pack=status_of(wp, su.flags, uid) == "premium" and bool(su.flags.get("gift")),
        groundBattleRb=wp.get("economicRankTankHistorical") if branch != "ground" else None,
        groundBattleSb=wp.get("economicRankTankSimulation") if branch != "ground" else None,
        guns=guns,
    )


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
            if "/" not in nation:
                continue  # pre-branch format; nothing comparable
            new = meta.perNation.get(nation, 0)
            if new < count * (1 - MAX_NATION_DROP):
                problems.append(f"{nation}: {count} -> {new} vehicles (more than a 5% drop)")
    if problems and not os.environ.get("WTBR_SKIP_VALIDATION"):
        raise ValidationError("data validation failed:\n  " + "\n  ".join(problems[:50]))


def _attach_store(details: dict[str, UnitDetail], cache: Path) -> StoreData | None:
    """Gaijin Store packs onto the vehicles they contain."""
    loaded = store.load(cache)
    if not loaded:
        return None
    fetched, products = loaded
    vehicles = [
        (uid, d.branch, d.nation, [d.name, d.fullName])
        for uid, d in details.items()
        if not d.removedIn and d.status == "premium"
    ]
    units = store.match_vehicles(products, vehicles)
    packs = [
        StorePack(
            id=p.id,
            title=p.title,
            url=p.url,
            image=p.image,
            price=p.price,
            oldPrice=p.oldPrice,
            currency=p.currency or "$",
            endsAt=p.endsAt,
            units=units.get(p.id, []),
            contents=p.contents,
        )
        for p in products
    ]
    for pack in packs:
        for uid in pack.units:
            d = details[uid]
            d.storePacks.append(pack.model_copy(update={"contents": []}))
            if pack.price and (d.storePrice is None or pack.price < d.storePrice):
                d.storePrice = pack.price
    return StoreData(fetched=fetched, packs=packs)


def _attach_market(details: dict[str, UnitDetail], folder: Path) -> MarketData | None:
    """Prices from the newest Gaijin Market snapshot onto vehicles; every item, with its price
    history across snapshots, for the market page."""
    snaps = market.load_snapshots(folder)
    if not snaps:
        return None
    latest = snaps[-1]
    by_item_id = {d.marketItemId: uid for uid, d in details.items() if d.marketItemId}
    vehicles = [
        (uid, d.branch, d.nation, [d.name, d.fullName])
        for uid, d in details.items()
        if not d.removedIn
    ]
    skin_owner = market.match_skins(latest.items, vehicles)

    history: dict[str, list[MarketPoint]] = {}
    for snap in snaps:
        for it in snap.items:
            point = MarketPoint(
                d=snap.date, price=market.gjn(it.get("price")), buy=market.gjn(it.get("buy_price"))
            )
            history.setdefault(it["hash_name"], []).append(point)

    entries = []
    for it in latest.items:
        t = market.tags(it)
        kind = t.get("type", "other")
        quote = MarketQuote(
            name=it["hash_name"],
            title=it["name"],
            price=market.gjn(it.get("price")),
            buy=market.gjn(it.get("buy_price")),
            sellers=it.get("depth") or 0,
            buyers=it.get("buy_depth") or 0,
            icon=it.get("icon"),
            quality=t.get("quality"),
            event=t.get("eventName"),
        )
        unit = None
        if kind in market.VEHICLE_TYPES:
            item_id = next(
                (
                    int(a["value"])
                    for a in it.get("asset_class", [])
                    if a.get("name") == "__itemdefid"
                ),
                None,
            )
            unit = by_item_id.get(item_id) or market.vehicle_id(it)
            if unit in details:
                d = details[unit]
                d.market, d.marketName, d.marketPrice = quote, quote.name, quote.price
        elif kind == "skin":
            unit = skin_owner.get(it["hash_name"])
            if unit in details:
                details[unit].skins.append(quote)
        entries.append(
            MarketEntry(
                **quote.model_dump(),
                kind=kind,
                unit=unit if unit in details else None,
                country=t.get("country"),
                history=history.get(it["hash_name"], []),
            )
        )
    for d in details.values():
        d.skins.sort(key=lambda q: (q.price is None, q.price or 0))
    return MarketData(snapshot=latest.date, snapshots=[s.date for s in snaps], items=entries)


# Patch notes that name a vehicle, kept on its page.
MENTIONS_PER_UNIT = 25
# A changelog entry without a version in its title (major updates are titled by name) belongs to
# the first game version that went live within this many days after it.
NOTE_VERSION_DAYS = 3


def _patch_notes(
    details: dict[str, UnitDetail], entries: list[dict], versions: list[tuple[str, str]]
) -> list[PatchNote]:
    """Parse cached changelog entries, tie each to an update page and to the vehicles it names."""
    from datetime import date as d_

    from .records import loose

    by_name: dict[str, list[str]] = {}
    for uid, d in details.items():
        for n in {d.name, d.fullName}:
            if n:
                by_name.setdefault(loose(n), []).append(uid)
    known = {v for v, _ in versions}

    def for_version(version: str | None, day: str) -> str | None:
        if version:
            return version if version in known else None
        for v, vd in versions:
            gap = (d_.fromisoformat(vd) - d_.fromisoformat(day)).days
            if 0 <= gap <= NOTE_VERSION_DAYS:
                return v
        return None

    out = []
    for e in entries:
        sections = []
        mentioned: set[str] = set()
        for sec in patchnotes.parse_article(e["html"]):
            items = []
            for it in sec.items:
                units = []
                for name, nation in patchnotes.lead_names(it.lead) if it.lead else []:
                    ids = by_name.get(loose(name), [])
                    if nation:
                        ids = [u for u in ids if details[u].nation == nation] or ids
                    units += [u for u in ids if u not in units]
                mentioned.update(units)
                items.append(PatchNoteItem(html=it.html, depth=it.depth, units=units))
                for u in units:
                    details[u].patchNotes.append(
                        PatchMention(id=e["id"], date=e["date"], title=e["title"], html=it.html)
                    )
            sections.append(PatchNoteSection(title=sec.title, items=items))
        version = patchnotes.version_of(e["title"])
        out.append(
            PatchNote(
                id=e["id"],
                title=e["title"],
                date=e["date"],
                summary=e.get("summary") or "",
                image=e.get("image"),
                version=version,
                forVersion=for_version(version, e["date"]),
                units=len(mentioned),
                url=patchnotes.ENTRY_URL.format(id=e["id"]),
                sections=sections,
            )
        )
    for d in details.values():
        d.patchNotes.sort(key=lambda m: (m.date, m.id), reverse=True)
        del d.patchNotes[MENTIONS_PER_UNIT:]
    return out


def _attach_records(details: dict[str, UnitDetail], rows: list, lang: dict) -> None:
    """Match sheet rows to vehicles (records.match), then attach the best record per vehicle."""
    cands = [
        records.Candidate(
            d.id, d.nation, [lang.get(f"{d.id}{s}") for s in ("_shop", "_0", "_1")], d.br.rb
        )
        for d in details.values()
        if d.branch == "ground"  # the sheet is ground RB only
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
            branch=h.branch,
            nation=h.nation,
            operator=parse.operator_country(tags, h.nation),
            rank=h.tier or 1,
            type=parse.unit_type(tags, wp),
            name=name,
            fullName=lang.get(f"{uid}_0") or name,
            status=status_of(wp, {}, uid),
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
        counts: dict[str, BranchCounts] = {}

        def bc(uid: str, counts=counts) -> BranchCounts:
            return counts.setdefault(details[uid].branch, BranchCounts())

        for c in v.changes:
            k = bc(c["id"])
            k.changes += 1
            k.up += c["to"][1] > c["from"][1]
            k.down += c["to"][1] < c["from"][1]
        if i > 0:
            for uid in v.added:
                bc(uid).added += 1
        for uid in v.removed:
            bc(uid).removed += 1
        infos.append(
            VersionInfo(v=v.version, d=v.date[:10], major=major_of(v.version), byBranch=counts)
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

    for (branch, nation), layouts in hist.layouts.items():
        ids = {u for _, cols in layouts for col in cols for _, us, _ in col for u in us}
        if not any(u in hist.units for u in ids):
            continue
        tm = TimeMachine(
            nation=nation,
            branch=branch,
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
        _write(out / "public" / "timemachine" / branch / f"{nation}.json", tm)


def _official(raw: list[dict], details: dict, lang: dict, today: str) -> list[Announcement]:
    names = {
        uid: [n for n in (lang.get(f"{uid}{s}") for s in ("_shop", "_0", "_1")) if n]
        for uid in details
    }
    overrides = official.load_overrides(paths.MANUAL / "official.toml")
    out = []
    unmatched = 0
    for a in sorted(raw, key=lambda a: a["date"], reverse=True):
        rows = [r for t in a["tabs"] for r in official.parse_tab(t["name"], t["csv"])]
        official.match_rows(rows, a["date"], details, names, overrides)
        changes = []
        for r in rows:
            ids = r.id.split(",") if r.id else []
            unmatched += not ids
            c = OfficialChange(
                name=r.name, branch=r.branch, ids=ids, comment=r.comment, **r.changes
            )
            if a["kind"] == "planned" and ids:
                hist = details[ids[0]].history
                c.outcome = {
                    m: official.outcome(hist, a["date"], today, m, *r.changes[m])
                    for m in ("ab", "rb", "sb")
                    if m in r.changes and hist
                }
            changes.append(c)
        out.append(
            Announcement(
                id=a["id"], title=a["title"], date=a["date"], kind=a["kind"], url=a["url"],
                changes=changes, unavailable=bool(a["unavailable"]) and not changes,
            )
        )  # fmt: skip
    total = sum(len(a.changes) for a in out)
    print(f"official: {len(out)} announcements, {total} rows, {unmatched} unmatched")
    return out


def _dev_preview(dev: tuple, lang: dict) -> DevPreview:
    """dev = (pending Point, base Point, changes, added ids, {id: (branch, nation)}, ranks)."""
    point, base, changes, added, where, ranks = dev
    return DevPreview(
        v=point.version,
        d=point.date[:10],
        base=base.version,
        changes=[
            BrChange(id=c["id"], before=Ranks(**_r(c["from"])), after=Ranks(**_r(c["to"])))
            for c in changes
        ],
        added={
            u: DevUnit(
                name=lang.get(f"{u}_shop") or lang.get(f"{u}_0") or u,
                branch=where[u][0],
                nation=where[u][1],
                br=Ranks(**_r(ranks[u])),
            )
            for u in added
        },
    )


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
