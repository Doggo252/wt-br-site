"""Ground RB kill records from the community records sheet.

One tab per nation, read as CSV through the sheet's public gviz endpoint.
Columns: Kills, Tank, Player, BR, Patch Version, Screenshot, Screenshot 2, Video.
Rows with no kills list vehicles that have no record yet.

Vehicle names are matched to datamine IDs within the tab's nation by
normalized name, using the sheet's emoji conventions for the game's glyphs,
with manual overrides in etl/manual/records.toml.
"""

import csv
import io
import re
import tomllib
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

SHEET_ID = "1MJEjscVDZ1hgU7fHp6dB0levgh6rnpXwOlI7fTBXly0"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
CSV_URL = SHEET_URL + "/gviz/tq?tqx=out:csv&sheet={}"

TABS = {
    "usa": "USA",
    "germany": "Germany",
    "ussr": "USSR",
    "britain": "Britain",
    "japan": "Japan",
    "china": "China",
    "italy": "Italy",
    "france": "France",
    "sweden": "Sweden",
    "israel": "Israel",
}

# The sheet writes the game's private-use name glyphs as emoji or symbols.
EMOJI_TO_GLYPH = [
    ("🌩️", "◍"),
    ("🌩", "◍"),
    ("🐾", "␠"),
    ("★", "▂"),
]


@dataclass
class Record:
    nation: str
    name: str  # as written in the sheet
    kills: int | None
    player: str | None
    br: str | None
    patch: str | None
    id: str | None = None


def fetch(cache: Path) -> dict[str, str]:
    cache.mkdir(parents=True, exist_ok=True)
    out = {}
    for nation, tab in TABS.items():
        url = CSV_URL.format(urllib.parse.quote(tab))
        with urllib.request.urlopen(url, timeout=60) as r:
            text = r.read().decode("utf-8")
        if not text.startswith('"Kills"'):
            # gviz falls back to the first tab (the rules) when a name doesn't match.
            raise RuntimeError(f"records sheet tab {tab!r} not found (got {text[:60]!r})")
        (cache / f"{nation}.csv").write_text(text, encoding="utf-8")
        out[nation] = text
    return out


def parse(nation: str, text: str) -> list[Record]:
    rows = list(csv.DictReader(io.StringIO(text)))
    out = []
    for r in rows:
        name = (r.get("Tank") or "").strip()
        if not name:
            continue
        kills = (r.get("Kills") or "").strip()
        out.append(
            Record(
                nation=nation,
                name=name,
                kills=int(kills) if kills.isdigit() else None,
                player=(r.get("Player") or "").strip() or None,
                br=(r.get("BR") or "").strip() or None,
                patch=(r.get("Patch Version") or "").strip() or None,
            )
        )
    return out


def norm(name: str) -> str:
    """Lower-case, glyph-aware key: keeps the game's glyphs, drops spaces and punctuation."""
    for emoji, glyph in EMOJI_TO_GLYPH:
        name = name.replace(emoji, glyph)
    name = unicodedata.normalize("NFKC", name).lower()
    name = name.replace("️", "").replace("​", "")
    return re.sub(r"[\s\-_.,'\"()/]+", "", name)


GLYPHS = re.compile(r"[\u2400-\u24ff\u2580-\u25ff\u22e0\u2622\uf000-\uf8ff]")


def loose(name: str) -> str:
    """Looser key: also ignores the game's glyphs (the sheet omits operator-country ones)
    and accents (Waffenträger / Waffentrager)."""
    key = GLYPHS.sub("", norm(name))
    key = unicodedata.normalize("NFKD", key)
    return "".join(c for c in key if not unicodedata.combining(c))


@dataclass
class Candidate:
    id: str
    nation: str
    names: list[str]
    rb: int  # current RB economic rank


def match(records: list[Record], candidates: list[Candidate], overrides: dict[str, str]) -> None:
    """Fill Record.id in place."""
    exact: dict[tuple[str, str], list[Candidate]] = {}
    fuzzy: dict[tuple[str, str], list[Candidate]] = {}
    for c in candidates:
        for x in {x for x in c.names if x}:
            exact.setdefault((c.nation, norm(x)), []).append(c)
            fuzzy.setdefault((c.nation, loose(x)), []).append(c)

    taken: set[str] = set()
    pending = []
    for r in records:
        key = f"{r.nation}|{r.name}"
        if key in overrides:
            r.id = overrides[key] or None
        else:
            r.id = _pick(r, exact.get((r.nation, norm(r.name)), []))
        if r.id:
            taken.add(r.id)
        else:
            pending.append(r)
    # Second pass, loose names, skipping vehicles that already have a record.
    for r in pending:
        found = [c for c in fuzzy.get((r.nation, loose(r.name)), []) if c.id not in taken]
        r.id = _pick(r, list({c.id: c for c in found}.values()))
        if r.id:
            taken.add(r.id)


def _pick(r: Record, found: list[Candidate]) -> str | None:
    found = list({c.id: c for c in found}.values())
    if len(found) > 1 and r.br:
        # Same name twice in one tree (tech tree and premium copies): pick by the sheet's BR.
        found = [c for c in found if f"{c.rb / 3 + 1:.1f}" == r.br] or found
    return found[0].id if len(found) == 1 else None


def load_overrides(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    return {
        f"{nation}|{name}": uid for nation, names in data.items() for name, uid in names.items()
    }
