"""Parsers for datamine files. Each takes already-loaded JSON/text and returns plain data."""

import csv
import io
from collections.abc import Iterator
from dataclasses import dataclass, field

from .br import WPCOST_FIELD
from .thermals import thermal_gen

GROUND_MOVE_TYPES = {"tank", "heavy_tank", "wheeled_vehicle"}

# unittags type_* tag -> our unit type, in priority order.
TYPE_TAGS = [
    ("type_spaa", "spaa"),
    ("type_tank_destroyer", "tank_destroyer"),
    ("type_missile_tank", "tank_destroyer"),
    ("type_heavy_tank", "heavy_tank"),
    ("type_medium_tank", "medium_tank"),
    ("type_light_tank", "light_tank"),
]


def nation_of(country: str) -> str:
    return country.removeprefix("country_")


# --- wpcost.blkx -----------------------------------------------------------


def ground_ranks(wpcost: dict) -> dict[str, dict[str, int]]:
    """{unit_id: {"ab": r, "rb": r, "sb": r}} for every ground vehicle."""
    out = {}
    for uid, u in wpcost.items():
        if isinstance(u, dict) and u.get("unitMoveType") in GROUND_MOVE_TYPES:
            out[uid] = {mode: int(u.get(f, 0)) for mode, f in WPCOST_FIELD.items()}
    return out


# --- shop.blkx -------------------------------------------------------------


@dataclass
class ShopUnit:
    id: str
    nation: str
    rank: int
    column: int
    flags: dict
    group: str | None = None


@dataclass
class ShopCell:
    rank: int
    units: list[str]
    group: str | None = None


@dataclass
class ShopTree:
    nation: str
    columns: list[list[ShopCell]] = field(default_factory=list)


def _is_unit(v: dict) -> bool:
    return "rank" in v


def parse_shop(shop: dict, section: str = "army") -> tuple[dict[str, ShopUnit], list[ShopTree]]:
    """Tech tree layout. A column is an ordered dict of units and folders (groups)."""
    units: dict[str, ShopUnit] = {}
    trees: list[ShopTree] = []
    for country, sections in shop.items():
        sec = sections.get(section) if isinstance(sections, dict) else None
        if not sec:
            continue
        nation = nation_of(country)
        tree = ShopTree(nation)
        for ci, column in enumerate(_columns(sec)):
            cells: list[ShopCell] = []
            for key, v in column.items():
                if not isinstance(v, dict):
                    continue
                if _is_unit(v):
                    units[key] = ShopUnit(key, nation, int(v["rank"]), ci, v)
                    cells.append(ShopCell(int(v["rank"]), [key]))
                else:
                    members = [(k, m) for k, m in v.items() if isinstance(m, dict) and _is_unit(m)]
                    if not members:
                        continue
                    for k, m in members:
                        units[k] = ShopUnit(k, nation, int(m["rank"]), ci, m, group=key)
                    rank = min(int(m["rank"]) for _, m in members)
                    cells.append(ShopCell(rank, [k for k, _ in members], group=key))
            tree.columns.append(cells)
        trees.append(tree)
    return units, trees


def _columns(section) -> list[dict]:
    """Columns of one tree. Current files: {"range": [col, ...]}.
    Older files (2020-2022): [{"range": col}, ...]."""
    if isinstance(section, list):
        return [
            x["range"] for x in section if isinstance(x, dict) and isinstance(x.get("range"), dict)
        ]
    return [c for c in _as_list(section.get("range")) if isinstance(c, dict)]


def _as_list(x) -> list:
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


# --- units.csv -------------------------------------------------------------


def parse_lang(text: str, wanted_suffixes=("_shop", "_0")) -> dict[str, str]:
    """English strings keyed by ID, for unit and shop-group rows."""
    out = {}
    reader = csv.reader(io.StringIO(text), delimiter=";", quotechar='"')
    next(reader, None)
    for row in reader:
        if len(row) < 2:
            continue
        key, en = row[0], row[1]
        if key.startswith("shop/group/") or key.endswith(wanted_suffixes):
            out[key] = en
    return out


def parse_weaponry(text: str) -> dict[str, str]:
    """English weapon names keyed by lower-case weapon id ("weapons/<id>" rows)."""
    out = {}
    reader = csv.reader(io.StringIO(text), delimiter=";", quotechar='"')
    next(reader, None)
    for row in reader:
        if len(row) >= 2 and row[0].startswith("weapons/"):
            out[row[0].removeprefix("weapons/").lower()] = row[1]
    return out


# --- unittags.blkx ---------------------------------------------------------


def unit_type(tags: dict) -> str:
    for tag, t in TYPE_TAGS:
        if tags.get(tag):
            return t
    return "other"


def operator_country(tags: dict, nation: str) -> str | None:
    """The flag country when a vehicle sits in another nation's tree (e.g. Finland in Sweden)."""
    for t in tags:
        if t.startswith("country_") and nation_of(t) != nation:
            return nation_of(t)
    return None


# --- tankmodels/<id>.blkx ----------------------------------------------------

# nightVision keys -> (crew, kind)
SIGHT_KEYS = {
    "gunnerThermal": ("gunner", "thermal"),
    "gunnerIr": ("gunner", "ir"),
    "commanderViewThermal": ("commander", "thermal"),
    "commanderViewIr": ("commander", "ir"),
    "driverThermal": ("driver", "thermal"),
    "driverIr": ("driver", "ir"),
}


def _nv_blocks(model: dict) -> Iterator[tuple[dict, bool]]:
    nv = model.get("nightVision")
    if isinstance(nv, dict):
        yield nv, False
    for mod in (model.get("modifications") or {}).values():
        if isinstance(mod, dict) and isinstance(mod.get("effects"), dict):
            mnv = mod["effects"].get("nightVision")
            if isinstance(mnv, dict):
                yield mnv, True


def parse_sights(model: dict) -> dict[str, list[dict]]:
    """Night sights per crew position, best first. Thermal beats IR; higher resolution wins."""
    found: dict[tuple[str, str, tuple[int, int]], bool] = {}
    for block, via_mod in _nv_blocks(model):
        for key, (crew, kind) in SIGHT_KEYS.items():
            v = block.get(key)
            if isinstance(v, dict) and isinstance(v.get("resolution"), list):
                res = tuple(int(x) for x in v["resolution"][:2])
                k = (crew, kind, res)
                # Stock beats modification if both provide the same sight.
                found[k] = found.get(k, True) and via_mod
    out: dict[str, list[dict]] = {}
    for (crew, kind, res), via_mod in found.items():
        s = {"kind": kind, "resolution": res, "viaModification": via_mod}
        if kind == "thermal":
            s["gen"] = thermal_gen(*res)
        out.setdefault(crew, []).append(s)
    for sights in out.values():
        sights.sort(key=lambda s: (s["kind"] == "thermal", s["resolution"][0]), reverse=True)
    return out


def best_thermal(sights: dict[str, list[dict]]) -> dict[str, int]:
    out = {}
    for crew, ss in sights.items():
        gens = [s["gen"] for s in ss if s["kind"] == "thermal" and s.get("gen")]
        if gens:
            out[crew] = max(gens)
    return out


def _gun_name(blk: str, weaponry: dict[str, str]) -> str:
    """'…/88mm_Kwk36_user_cannon.blk' -> '88 mm KwK36 cannon'."""
    wid = blk.rsplit("/", 1)[-1].removesuffix(".blk")
    return weaponry.get(wid.lower(), wid)


def parse_stats(model: dict, wp: dict, tags: dict, weaponry: dict[str, str]) -> dict:
    phys = model.get("VehiclePhys") or {}
    mass_kg = (phys.get("Mass") or {}).get("TakeOff") or model.get("mass")
    hp = (phys.get("engine") or {}).get("horsePowers")
    weapons = _as_list((model.get("commonWeapons") or {}).get("Weapon"))
    weapons = [w for w in weapons if isinstance(w, dict) and w.get("blk")]
    main = next((w for w in weapons if "cannon" in w["blk"]), weapons[0] if weapons else None)
    shop = tags.get("Shop") or {}
    stats = {
        "massT": round(mass_kg / 1000, 1) if mass_kg else None,
        "enginePowerHp": hp,
        "powerToWeight": round(hp / (mass_kg / 1000), 1) if hp and mass_kg else None,
        "maxSpeedFwd": model.get("maxFwdSpeed"),
        "maxSpeedRev": model.get("maxRevSpeed"),
        "crew": wp.get("crewTotalCount"),
        "reloadS": wp.get("reloadTime_cannon"),
        "mainGun": _gun_name(main["blk"], weaponry) if main else None,
        "armorHull": _armor(shop.get("armorThicknessHull")),
        "armorTurret": _armor(shop.get("armorThicknessTurret")),
    }
    return {k: v for k, v in stats.items() if v is not None}


def _armor(v) -> tuple[float, float, float] | None:
    if isinstance(v, list) and len(v) == 3:
        return tuple(float(x) for x in v)
    return None
