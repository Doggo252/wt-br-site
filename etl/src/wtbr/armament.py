"""Aircraft and helicopter armament: guns, defensive turrets and ordnance loadouts.

From gamedata/flightmodels/<unit>.blkx. Guns sit in `commonWeapons`. Ordnance comes two ways:
older aircraft list whole loadouts (`weapon_presets`, each a file in flightmodels/weaponpresets),
newer ones have pylons (`WeaponSlots`), each with a choice of stores, and their presets just pick
one store per pylon. Rocket pods and missile racks are containers (gamedata/weapons/containers)
holding a number of one weapon.
"""

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

from .models import Armament, Loadout, Pylon, WeaponCount

GUN_TRIGGERS = ("machine gun", "cannon", "additional gun")


def _list(x: Any) -> list:
    return x if isinstance(x, list) else ([x] if x is not None else [])


def _int(x: Any, default: int = 1) -> int:
    """Numbers sometimes come as one-item lists in the blk-to-json conversion."""
    x = x[0] if isinstance(x, list) and x else x
    return int(x) if isinstance(x, (int, float)) else default


def stem(blk: str) -> str:
    """'gameData/Weapons/BombGuns/de_sc50.blk' -> 'de_sc50'."""
    return blk.rsplit("/", 1)[-1].lower().removesuffix(".blk")


class Arsenal:
    """Resolves weapon blk paths to names and container contents."""

    def __init__(self, names: dict[str, str], short: dict[str, str], containers: Path):
        self.names, self.short, self.containers = names, short, containers
        self._cache: dict[str, dict | None] = {}

    def container(self, s: str) -> dict | None:
        if s not in self._cache:
            f = self.containers / f"{s}.blkx"
            self._cache[s] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else None
        return self._cache[s]

    def name(self, s: str) -> str:
        return self.short.get(s) or self.names.get(s) or s

    def expand(self, w: dict) -> tuple[str, int] | None:
        """One weapon entry -> (name, how many rounds or stores it adds). A pod entry is one
        pod (its own count repeats the pod's); pods can hold pods ("3 × LAU-131")."""
        blk = w.get("blk") or ""
        if not blk or w.get("dummy") or "dummy" in blk:
            return None
        if "/containers/" not in blk.lower():
            return self.name(stem(blk)), _int(w.get("bullets"))
        n = 1
        for _ in range(4):
            c = self.container(stem(blk)) if "/containers/" in blk.lower() else None
            if not (c and c.get("blk")):
                break
            n *= _int(c.get("bullets"))
            blk = c["blk"]
        return self.name(stem(blk)), n


def _count(entries: list[tuple[str, int]]) -> list[WeaponCount]:
    """Stores: total count per weapon, in first-seen order."""
    totals: dict[str, int] = {}
    for name, n in entries:
        totals[name] = totals.get(name, 0) + n
    return [WeaponCount(name=k, count=v) for k, v in totals.items()]


def _guns(entries: list[tuple[str, int]]) -> list[WeaponCount]:
    """Guns: how many barrels of each, and rounds per barrel."""
    out: dict[str, WeaponCount] = {}
    for name, ammo in entries:
        g = out.setdefault(name, WeaponCount(name=name, count=0, ammo=0))
        g.count += 1
        g.ammo = (g.ammo or 0) + ammo
    for g in out.values():
        g.ammo = round((g.ammo or 0) / g.count) if g.count else None
    return list(out.values())


def armament(
    fm: dict,
    arsenal: Arsenal,
    load_preset: Callable[[str], dict | None],
    mods: dict,
) -> Armament | None:
    """`load_preset` reads a weaponpresets file from its blk path; `mods` is wpcost
    modifications, for the tier that unlocks a loadout."""
    slots = {
        _int(s.get("index"), i): s
        for i, s in enumerate(_list((fm.get("WeaponSlots") or {}).get("WeaponSlot")))
        if isinstance(s, dict)
    }

    def slot_weapons(slot: int, preset: str) -> list[dict]:
        for p in _list(slots.get(slot, {}).get("WeaponPreset")):
            if isinstance(p, dict) and p.get("name") == preset:
                return [w for w in _list(p.get("Weapon")) if isinstance(w, dict)]
        return []

    def resolve(ws: list) -> list[dict]:
        out = []
        for w in ws:
            if not isinstance(w, dict):
                continue
            if "slot" in w and "preset" in w:
                out += slot_weapons(_int(w["slot"], -1), w["preset"])
            else:
                out.append(w)
        return out

    def tier(req: str | list | None) -> int | None:
        """Tier of the modification that unlocks it; the highest when several are needed."""
        tiers = [m.get("tier") or 0 for r in _list(req) if isinstance(m := mods.get(r), dict)]
        return max(tiers) or None if tiers else None

    common = resolve(_list((fm.get("commonWeapons") or {}).get("Weapon")))
    guns, turrets, flares = [], [], 0
    for w in common:
        e = arsenal.expand(w)
        if not e:
            continue
        trigger = str(w.get("trigger") or "")
        if trigger == "countermeasures":
            flares += e[1]
        else:
            (turrets if trigger.startswith("gunner") else guns).append(e)
    builtin = {name for name, _ in guns + turrets}

    presets: list[Loadout] = []
    pylons: list[Pylon] = []
    if slots:
        for idx in sorted(slots):
            options = []
            for p in _list(slots[idx].get("WeaponPreset")):
                if not isinstance(p, dict):
                    continue
                items = [
                    e
                    for w in _list(p.get("Weapon"))
                    if str(w.get("trigger") or "") != "countermeasures" and (e := arsenal.expand(w))
                ]
                if items and not {name for name, _ in items} <= builtin:
                    options.append(
                        Loadout(
                            name=p.get("name"),
                            items=_count(items),
                            tier=tier(p.get("reqModification")),
                        )
                    )
            # The gun slot (usually 0) is listed with the guns already.
            if options:
                pylons.append(Pylon(index=idx, options=options))
    else:
        for p in _list((fm.get("weapon_presets") or {}).get("preset")):
            if not isinstance(p, dict) or not p.get("blk"):
                continue
            data = load_preset(p["blk"]) or {}
            ws = resolve(_list(data.get("Weapon")))
            items = []
            for w in ws:
                e = arsenal.expand(w)
                if str(w.get("trigger") or "") == "countermeasures":
                    continue
                if e and str(w.get("trigger") or "") not in GUN_TRIGGERS:
                    items.append(e)
                elif e:  # gun pods: barrels, not rounds
                    items.append((e[0], 1))
            if items:
                presets.append(
                    Loadout(
                        name=p.get("name"), items=_count(items), tier=tier(p.get("reqModification"))
                    )
                )

    if not (guns or turrets or presets or pylons):
        return None
    return Armament(
        guns=_guns(guns),
        turrets=_guns(turrets),
        countermeasures=flares or None,
        presets=presets,
        pylons=[p for p in pylons if p.options],
    )
