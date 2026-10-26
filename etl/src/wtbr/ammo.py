"""Shells for ground vehicle guns: what each one is and how much armour it goes through.

A gun's weapon file (gamedata/weapons/groundmodels_weapons/<gun>.blkx) holds its default shell
under `bullet` and every other shell under the ammo modification that unlocks it. Penetration is
stored in one of three ways, and the game's own numbers come out of them like this:

- HEAT and HESH carry the value directly (`cumulativeDamage.armorPower`, or an `armorpower`
  table by distance).
- Full-calibre and APCR shot use the de Marre formula with per-shell exponents.
- Long-rod APFSDS uses the Lanz-Odermatt formula from rod length, density and velocity.

Velocity at range comes from a drag integration with the shell's own drag coefficient, which
reproduces the falloff the game shows (DM53: 653 mm at 10 m, 605 mm at 2000 m).
"""

import math
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from .models import AmmoOption, Gun, Round

DISTANCES = (10, 100, 500, 1000, 1500, 2000)
AIR_DENSITY = 1.225  # kg/m3 at sea level
DEFAULT_CX = 0.35  # shells without their own drag coefficient (fits the game's falloff)
RHA_DENSITY = 7850.0
RHA_BHN = 260.0

# de Marre: P = K * v^a * m^b / (KFBR^a * (d/100)^c) * 100, d in mm.
KFBR = 1900.0

# Explosive filler weakens full-calibre shot: (filler % of mass, multiplier), linear between.
FILLER_FACTOR = ((0.65, 1.0), (1.6, 0.93), (2.0, 0.9), (3.0, 0.85), (4.0, 0.75))

# Lanz-Odermatt constants by rod material: a, c0, c1 (b0, b1 are shared).
LANZ_ODERMATT = {
    "tungsten": (0.994, 134.5, -0.148),
    "depletedUranium": (0.825, 90.0, -0.0849),
    "steel": (1.104, 9874.0, 0.0),
}
LO_B0, LO_B1 = 0.283, 0.0656

# Short labels for bulletType prefixes, longest prefix first.
TYPE_LABELS = (
    ("apds_fs", "APFSDS"),
    ("apds", "APDS"),
    ("apcr", "APCR"),
    ("aphebc", "APHEBC"),
    ("aphe", "APHE"),
    ("apcbc", "APCBC"),
    ("apbc", "APBC"),
    ("apc", "APC"),
    ("ap", "AP"),
    ("heat_fs", "HEATFS"),
    ("heat_grenade", "HEAT"),
    ("heat", "HEAT"),
    ("hesh", "HESH"),
    ("he_frag_dist", "HE-VT"),
    ("he_frag_radio", "HE-VT"),
    ("he_frag_fs", "HE"),
    ("he", "HE"),
    ("sapcbc", "SAPCBC"),
    ("sapi", "SAPI"),
    ("sap", "SAP"),
    ("atgm", "ATGM"),
    ("sam", "SAM"),
    ("smoke", "Smoke"),
    ("shrapnel", "Shrapnel"),
    ("frag", "Frag"),
    ("rocket", "Rocket"),
    ("ahead", "AHEAD"),
    ("practice", "Practice"),
)


def type_label(bullet_type: str) -> str:
    for prefix, label in TYPE_LABELS:
        if bullet_type.startswith(prefix):
            return label
    return bullet_type.split("_")[0].upper()


def _one(x: Any) -> Any:
    return x[0] if isinstance(x, list) else x


def _kinetic(b: dict) -> dict:
    dmg = _one(b.get("damage")) or {}
    kin = _one(dmg.get("kinetic")) if isinstance(dmg, dict) else None
    return kin if isinstance(kin, dict) else {}


def velocity_at(b: dict, distance: float) -> float:
    """Speed after `distance` metres of flat flight, with drag F = ½ρv²·Cx·S (constant Cx)."""
    v0 = float(b.get("speed") or 0)
    mass = float(b.get("mass") or 0)
    cx = float(_one(b.get("Cx")) or DEFAULT_CX)
    caliber = float(b.get("ballisticCaliber") or b.get("caliber") or 0)
    if not (v0 and mass and cx and caliber):
        return v0
    k = 0.5 * AIR_DENSITY * cx * math.pi * (caliber / 2) ** 2 / mass
    return v0 * math.exp(-k * distance)


def filler_factor(b: dict) -> float:
    mass, filler = float(b.get("mass") or 0), float(b.get("explosiveMass") or 0)
    if not mass or not filler:
        return 1.0
    pct = 100 * filler / mass
    if pct <= FILLER_FACTOR[0][0]:
        return 1.0
    for (x0, y0), (x1, y1) in zip(FILLER_FACTOR, FILLER_FACTOR[1:], strict=False):
        if pct <= x1:
            return y0 + (y1 - y0) * (pct - x0) / (x1 - x0)
    return FILLER_FACTOR[-1][1]


def effective_mass(b: dict) -> float:
    """Mass de Marre sees. For APCR and APDS the core counts in full and the pallet or sabot in
    part: three quarters of it when the core is over 36% of the shell, less for lighter cores.
    The weights are fitted to the game's own figures (within 1 mm on the shells checked)."""
    mass = float(b.get("mass") or 0)
    core = float(b.get("damageMass") or 0)
    if not core or core >= mass:
        return mass
    share = core / mass
    weight = 0.75 if share > 0.36 else 0.282 + 0.741 * share
    return core + weight * (mass - core)


def demarre(b: dict, kin: dict, v: float) -> float:
    k = float(kin.get("demarrePenetrationK", 1.0))
    a = float(kin.get("demarreSpeedPow", 1.43))
    pm = float(kin.get("demarreMassPow", 0.71))
    pc = float(kin.get("demarreCaliberPow", 1.07))
    caliber_mm = float(b.get("damageCaliber") or b.get("caliber") or 0) * 1000
    mass = effective_mass(b)
    if not (caliber_mm and mass and v):
        return 0.0
    p = k * v**a * mass**pm / (KFBR**a * (caliber_mm / 100) ** pc) * 100
    return p * filler_factor(b)


def lanz_odermatt(b: dict, kin: dict, v: float) -> float:
    consts = LANZ_ODERMATT.get(kin.get("lanzOdermattMaterial", "tungsten"))
    length = float(kin.get("lanzOdermattWorkingLength") or 0)  # mm
    density = float(kin.get("lanzOdermattDensity") or 0)  # kg/m3
    diameter = float(b.get("damageCaliber") or b.get("caliber") or 0) * 1000  # mm
    if not (consts and length and density and diameter and v):
        return 0.0
    a, c0, c1 = consts
    vk = v / 1000
    ratio = a / math.tanh(LO_B0 + LO_B1 * length / diameter) * math.sqrt(density / RHA_DENSITY)
    return length * ratio * math.exp(-(c0 + c1 * RHA_BHN) * RHA_BHN / (density * vk * vk))


def _table(table: Any) -> list[tuple[float, float]]:
    """{'ArmorPower0m': [pen, dist], ...} -> [(dist, pen), ...] sorted by distance."""
    if not isinstance(table, dict):
        return []
    out = []
    for v in table.values():
        if isinstance(v, list) and len(v) == 2 and all(isinstance(x, (int, float)) for x in v):
            out.append((float(v[1]), float(v[0])))
    return sorted(out)


def _interp(points: list[tuple[float, float]], x: float) -> float:
    if not points:
        return 0.0
    if x <= points[0][0]:
        return points[0][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:], strict=False):
        if x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0) if x1 > x0 else y1
    return points[-1][1]


def kinetic_penetration(b: dict) -> list[int] | None:
    """Flat-plate penetration in mm at DISTANCES, or None when the shell has no kinetic model."""
    kin = _kinetic(b)
    if "lanzOdermattMaterial" in kin:
        fn = lanz_odermatt
    elif "demarrePenetrationK" in kin:
        fn = demarre
    else:
        table = _table(b.get("armorpower"))
        if not table:
            return None
        return [round(_interp(table, d)) for d in DISTANCES]
    return [round(fn(b, kin, velocity_at(b, d))) for d in DISTANCES]


def cumulative_penetration(b: dict) -> int | None:
    """Jet penetration of HEAT (and the HEAT warhead of ATGMs and rockets), in mm."""
    for src in (b, _one(b.get("rocket")) or {}):
        cd = _one(src.get("cumulativeDamage")) if isinstance(src, dict) else None
        if isinstance(cd, dict) and cd.get("armorPower"):
            return round(float(cd["armorPower"]))
    return None


def frag_penetration(tnt: float, curve: list[tuple[float, float]]) -> float | None:
    """Armour the blast and fragments go through, from TNT-equivalent mass on the game's curve
    (explosive.blkx explosiveTypeToSplashParams.explosiveMassToPenetration)."""
    return round(_interp(curve, tnt), 1) if tnt and curve else None


@dataclass
class Explosives:
    """From gamedata/damage_model/explosive.blkx."""

    strength: dict[str, float]  # TNT equivalent per kg, by explosive type
    curve: list[tuple[float, float]]  # TNT kg -> mm

    @classmethod
    def parse(cls, data: dict) -> "Explosives":
        types = data.get("explosiveTypes") or {}
        curve = (data.get("explosiveTypeToSplashParams") or {}).get("explosiveMassToPenetration")
        return cls(
            {
                k: float(v.get("strengthEquivalent", 1))
                for k, v in types.items()
                if isinstance(v, dict)
            },
            sorted((float(x), float(y)) for x, y in (curve or {}).values()),
        )


def _bullets(x: Any) -> list[dict]:
    return [b for b in (x if isinstance(x, list) else [x]) if isinstance(b, dict)]


def round_of(b: dict, names: dict[str, str], explosives: Explosives) -> Round:
    """`names` is units_weaponry.csv: bulletName -> display name, <type>/name -> type name."""
    rocket = _one(b.get("rocket"))
    src = rocket if isinstance(rocket, dict) else b
    bullet_type = str(_one(b.get("bulletType") or src.get("bulletType") or ""))
    bullet_name = str(_one(b.get("bulletName") or src.get("bulletName") or ""))
    explosive = float(src.get("explosiveMass") or b.get("explosiveMass") or 0)
    explosive_type = src.get("explosiveType") or b.get("explosiveType")
    tnt = explosive * explosives.strength.get(explosive_type, 1.0) if explosive else 0.0
    shaped = bullet_type.startswith(("heat", "atgm")) or src.get("cumulativeDamage") is not None
    cumulative = cumulative_penetration(b)
    hesh = bullet_type.startswith("hesh")
    speed = float(b.get("speed") or 0) or float(src.get("endSpeed") or src.get("startSpeed") or 0)
    guided = isinstance(rocket, dict) and rocket.get("guidanceType")
    smoke = bullet_type.startswith("smoke") or explosive_type == "smoke_composition"
    return Round(
        name=names.get(bullet_name) or names.get(bullet_name.lower()) or bullet_name,
        type=names.get(f"{bullet_type}/name/short") or type_label(bullet_type),
        typeName=names.get(f"{bullet_type}/name"),
        mass=round(float(src.get("mass") or b.get("mass") or 0), 3) or None,
        speed=round(speed) or None,
        explosive=round(explosive, 3) or None,
        explosiveType=explosive_type if explosive else None,
        tnt=round(tnt, 3) or None,
        pen=None if (shaped or hesh or smoke) else kinetic_penetration(b),
        jet=cumulative if cumulative and not hesh else None,
        hesh=cumulative if hesh else None,
        frag=None if smoke else frag_penetration(tnt, explosives.curve),
        range=round(float(rocket.get("rangeMax") or rocket.get("maxDistance") or 0)) or None
        if guided
        else None,
        guidance=str(guided) if guided else None,
    )


def ammo_options(
    weapon: dict, mods: dict, names: dict[str, str], explosives: Explosives
) -> list[AmmoOption]:
    """Every shell or belt a gun can load on this vehicle: the default first, then each ammo
    modification the vehicle has (`mods` is its wpcost `modifications`; weapon files are shared
    between vehicles and list more). A belt lists each distinct round once, in belt order."""
    out: list[AmmoOption] = []
    entries = [(None, weapon.get("bullet"))] + [
        (k, v["bullet"])
        for k, v in weapon.items()
        if isinstance(v, dict) and "bullet" in v and isinstance(mods.get(k), dict)
    ]
    seen: set[tuple[str, ...]] = set()
    for mod, raw in entries:
        rounds, names_in = [], set()
        for b in _bullets(raw):
            r = round_of(b, names, explosives)
            if r.name not in names_in:
                names_in.add(r.name)
                rounds.append(r)
        key = tuple(r.name for r in rounds)
        if not rounds or key in seen:  # some guns list the same shell under two modifications
            continue
        seen.add(key)
        m = mods.get(mod) or {}
        pack = mods.get(m.get("reqModification")) or {}
        out.append(
            AmmoOption(
                mod=mod,
                tier=pack.get("tier") or None,
                rp=pack.get("reqExp") or None,
                perShell=m.get("value") or None,
                rounds=rounds,
            )
        )
    return out


def guns(
    model: dict,
    wp: dict,
    load: Callable[[str], dict | None],
    names: dict[str, str],
    explosives: Explosives,
    gun_names: dict[str, str],
) -> list[Gun]:
    """Cannons and launchers on a ground vehicle (machine guns left out), main gun first.
    `load` reads a weapon file from its blk path; `gun_names` is parse.parse_weaponry."""
    weapons = (model.get("commonWeapons") or {}).get("Weapon")
    out, seen = [], set()
    for w in weapons if isinstance(weapons, list) else [weapons]:
        blk = (w or {}).get("blk") if isinstance(w, dict) else None
        if not blk or "machinegun" in blk.lower() or blk.lower() in seen:
            continue
        seen.add(blk.lower())
        weapon = load(blk)
        if not weapon:
            continue
        options = ammo_options(weapon, wp.get("modifications") or {}, names, explosives)
        if not options:
            continue
        stem = blk.rsplit("/", 1)[-1].removesuffix(".blk")
        first = (_bullets(weapon.get("bullet")) or [{}])[0]
        caliber = float(first.get("caliber") or 0) * 1000
        name = gun_names.get(stem.lower(), stem)
        out.append(Gun(name=name, caliber=round(caliber, 1) or None, ammo=options))
    return out
