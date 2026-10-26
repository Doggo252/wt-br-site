"""Gaijin Market snapshots.

The Market's API needs a logged-in token, so snapshots are exported from a browser (see
etl/manual/market/README.md) and committed as etl/manual/market/<YYYY-MM-DD>.json. Each file is
the raw list of War Thunder assets from cln_market_search: hash_name, name, icon, prices, tags.
"""

import json
import re
from dataclasses import dataclass
from pathlib import Path

# Prices are integers in 1e-8 GJN (a 2.49 GJN key is 249000000).
PRICE_UNIT = 100_000_000
# Market tags -> our branch names.
VEHICLE_TYPES = {"tank": "ground", "aircraft": "air", "helicopter": "heli"}
VEHICLE_ICON = re.compile(r"/units/([a-z0-9_\-]+?)(?:_improved)?\.png$")


@dataclass
class Snapshot:
    date: str
    items: list[dict]


def load_snapshots(folder: Path) -> list[Snapshot]:
    """All snapshots, oldest first."""
    out = []
    for f in sorted(folder.glob("*.json")):
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", f.stem):
            out.append(Snapshot(f.stem, json.loads(f.read_text(encoding="utf-8"))))
    return out


def tags(item: dict) -> dict[str, str]:
    return dict(t.split(":", 1) for t in item.get("tags", []) if ":" in t)


def gjn(raw: int | None) -> float | None:
    return round(raw / PRICE_UNIT, 2) if raw else None


def vehicle_id(item: dict) -> str | None:
    """Vehicle icons are named after the game's unit id (`fr_amx_50_surblinde_improved.png`)."""
    m = VEHICLE_ICON.search(item.get("icon") or "")
    return m.group(1) if m else None


def _key(name: str) -> str:
    from .records import GLYPHS

    return re.sub(r"[^a-z0-9]+", " ", GLYPHS.sub("", name).lower()).strip()


def match_skins(
    items: list[dict], vehicles: list[tuple[str, str, str, list[str]]]
) -> dict[str, str]:
    """Skin hash_name -> unit id.

    `vehicles` is (id, branch, nation, names). A skin belongs to the vehicle of the same nation
    and type whose name is the longest whole-word prefix of the skin's name
    ("T-90M (Arena-M) 'Delta 1'", "Object 279: Black camouflage", 'Ferdinand "150100"').
    """
    by_group: dict[tuple[str, str], list[tuple[str, str]]] = {}
    for uid, branch, nation, names in vehicles:
        for n in {_key(n) for n in names if n}:
            by_group.setdefault((branch, nation), []).append((n, uid))
    for group in by_group.values():
        group.sort(key=lambda x: -len(x[0]))
    out = {}
    for it in items:
        t = tags(it)
        if t.get("type") != "skin":
            continue
        branch = VEHICLE_TYPES.get(t.get("vehicleType", ""))
        key = _key(it["name"])
        for n, uid in by_group.get((branch, t.get("country", "")), []):
            if key == n or key.startswith(n + " "):
                out[it["hash_name"]] = uid
                break
    return out
