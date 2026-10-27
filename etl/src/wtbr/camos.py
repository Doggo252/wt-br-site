"""Camouflages: the game's own (char config skins.blkx and unlocks.blkx, names from
unlocks_skins.csv) with how each is unlocked, plus Marketplace ones made by players.

A game camouflage is unlocked by playing the vehicle (progress points per kill or per target,
which can differ by mode), by owning another vehicle or earning an award, and most can also be
bought with Golden Eagles (`costGold`; -1 when they can't).
"""

import csv
import io
import math
import re

from .models import Camo

# Generic scheme names the game files leave unnamed ("ger_camo_winter_waves" -> "Winter waves").
_NATION_PREFIX = re.compile(r"^(?:[a-z]{2,4}_)?camo_")


def skin_names(text: str) -> dict[str, str]:
    """unlocks_skins.csv -> {key: English}. Fields may span lines, so read it as real CSV."""
    rows = csv.reader(io.StringIO(text), delimiter=";", quotechar='"')
    next(rows, None)
    return {r[0]: r[1] for r in rows if len(r) > 1 and r[1]}


def camo_name(unit: str, skin: str, names: dict[str, str]) -> str:
    for key in (f"{unit}/{skin}", f"skin/{skin}"):
        if key in names:
            return names[key].strip()
    words = _NATION_PREFIX.sub("", skin.lower()).replace("_", " ").strip()
    return words[:1].upper() + words[1:] if words else skin


def _per_mode(mode: dict) -> tuple[int, int, int] | None:
    """Points to earn, as a count in AB, RB and SB."""
    num = mode.get("num")
    if not isinstance(num, (int, float)) or num <= 0:
        return None
    muls = [mode.get(k) or 1 for k in ("mulArcade", "mulRealistic", "mulHardcore")]
    return tuple(math.ceil(num / m) for m in muls)  # type: ignore[return-value]


def _counted(counts: tuple[int, int, int], verb: str, noun: str) -> str:
    """(AB, RB, SB) counts -> "Destroy 42 enemies", or per mode when they differ."""
    ab, rb, sb = counts
    if ab == rb == sb:
        return f"{verb} {ab:,} {noun}"
    if rb == sb:
        return f"{verb} {ab:,} {noun} in Arcade or {rb:,} in Realistic and Simulator"
    return f"{verb} {ab:,} {noun} in Arcade, {rb:,} in Realistic or {sb:,} in Simulator"


def how_to_unlock(rule: dict | None, unit_names: dict[str, str]) -> str | None:
    """An unlocks.blkx skin entry -> what the player does, in words; None if nothing to do."""
    mode = (rule or {}).get("mode")
    if not isinstance(mode, dict):
        return None
    kind = mode.get("type")
    counts = _per_mode(mode)
    if kind == "killedPlayersScore" and counts:
        return _counted(counts, "Destroy", "enemy vehicles")
    if kind == "killedGroundScore" and counts:
        return _counted(counts, "Destroy", "ground or naval targets")
    if kind == "amountDamagesZone" and counts:
        return _counted(counts, "Drop", "kg of bombs on enemy bases")
    if kind == "awardDamage" and counts:
        return _counted(counts, "Deal", "damage to ships")
    if kind == "destructions" and isinstance(mode.get("num"), (int, float)):
        return f"Destroy {int(mode['num']):,} targets"
    if kind == "char_unit_exist" and mode.get("unit"):
        return f"Own the {unit_names.get(mode['unit'], mode['unit'])}"
    if kind == "char_unlocks":
        return "Special award"
    return None


def game_camos(
    skins: dict, unlocks: list, names: dict[str, str], unit_names: dict[str, str]
) -> dict[str, list[Camo]]:
    """{unit id: its camouflages}, in the game's order."""
    rules = {
        x["id"]: x for x in unlocks if isinstance(x, dict) and x.get("type") == "skin" and "id" in x
    }
    out: dict[str, list[Camo]] = {}
    for key, s in skins.items():
        if "/" not in key or not isinstance(s, dict):
            continue
        unit, skin = key.split("/", 1)
        rule = rules.get(s.get("unlock") or key)
        how = how_to_unlock(rule, unit_names)
        gold = s.get("costGold")
        gold = int(gold) if isinstance(gold, (int, float)) and gold > 0 else None
        if not how and not gold:
            how = "Event or special reward"
        out.setdefault(unit, []).append(
            Camo(id=skin, name=camo_name(unit, skin, names), how=how, gold=gold)
        )
    return out
