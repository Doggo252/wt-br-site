"""Gaijin's official Battle Rating change announcements.

Source: forum posts tagged br-changes (Discourse JSON API). Each post links a published
Google Sheet ("2PACX" key) with one tab per branch and "was / now" columns per game mode.
Posts are "planned" (before a change goes live) or "implemented".
Sheets that Gaijin has since unpublished are skipped.
"""

import csv
import io
import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

FORUM = "https://forum.warthunder.com"
TAG_URL = FORUM + "/tag/br-changes.json"
SHEET_KEY = re.compile(r"https://docs\.google\.com/spreadsheets/(?:u/\d+/)?d/e/(2PACX-[\w-]+)")
SHEET_TAB = re.compile(r'items\.push\(\{name: "([^"]+)", pageUrl: "[^"]+", gid: "(\d+)"')
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"
# Planned tables get edited after posting; refetch recent posts.
REFRESH_DAYS = 45


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def kind_of(title: str) -> str:
    t = title.lower()
    if "planned" in t or "responding to feedback" in t or "post feedback" in t:
        return "planned"
    if "implemented" in t or re.match(r"update \d", t):
        return "implemented"
    return "other"


def fetch(cache: Path) -> list[dict]:
    """Download announcements (cached per topic). Returns raw records, newest first."""
    cache.mkdir(parents=True, exist_ok=True)
    topics = json.loads(_get(TAG_URL))["topic_list"]["topics"]
    out = []
    for t in topics:
        path = cache / f"{t['id']}.json"
        age_days = (time.time() - path.stat().st_mtime) / 86400 if path.exists() else None
        created = t["created_at"][:10]
        recent = (
            time.time() - time.mktime(time.strptime(created, "%Y-%m-%d")) < REFRESH_DAYS * 86400
        )
        if path.exists() and not (recent and age_days and age_days > 0.5):
            out.append(json.loads(path.read_text()))
            continue
        post = json.loads(_get(f"{FORUM}/t/{t['id']}.json"))["post_stream"]["posts"][0]
        rec = {
            "id": t["id"],
            "title": t["title"],
            "date": created,
            "kind": kind_of(t["title"]),
            "url": f"{FORUM}/t/{t['slug']}/{t['id']}",
            "tabs": [],
            "unavailable": [],
        }
        for key in dict.fromkeys(SHEET_KEY.findall(post["cooked"])):
            base = f"https://docs.google.com/spreadsheets/d/e/{key}"
            try:
                tabs = SHEET_TAB.findall(_get(f"{base}/pubhtml"))
                if not tabs:  # single-tab sheets list no tabs
                    tabs = [("Sheet1", "0")]
                for name, gid in tabs:
                    text = _get(f"{base}/pub?gid={gid}&single=true&output=csv")
                    if text.lstrip().startswith("<"):
                        raise ValueError("sheet is no longer published")
                    rec["tabs"].append({"name": name, "csv": text})
            except (urllib.error.URLError, ValueError) as e:
                rec["unavailable"].append(f"{key}: {e}")
        path.write_text(json.dumps(rec, ensure_ascii=False))
        out.append(rec)
    return out


def load(cache: Path) -> list[dict]:
    return [json.loads(p.read_text()) for p in sorted(cache.glob("*.json"))]


# --- parsing ----------------------------------------------------------------------


def branch_of_tab(name: str) -> str | None:
    n = name.lower()
    # Naval tabs, aircraft-in-naval-battles and Air Simulator bracket tables aren't per-vehicle BRs
    # for anything we track.
    if any(w in n for w in ("naval", "fleet", "ship", "bracket")):
        return None
    if "heli" in n:
        return "heli"
    if "ground" in n or "tank" in n:
        return "ground"
    if "air" in n or "aviation" in n:
        return "air"
    return None  # naval and anything else isn't tracked


def _modes(label: str, branch: str) -> list[str]:
    """Sheet column label -> our fields. Aircraft also get a ground-battle column ("grb")."""
    lab = label.lower()
    if "arcade" in lab:
        return ["ab"]
    if branch in ("air", "heli") and lab.startswith("ground"):
        return ["grb"]
    out = []
    if "realistic" in lab:
        out.append("rb")
    if "simulator" in lab and (branch == "ground" or "realistic" not in lab):
        out.append("sb")
    return out


def _rank(cell: str) -> int | None:
    try:
        return round((float(cell.replace(",", ".")) - 1) * 3)
    except ValueError:
        return None


@dataclass
class Row:
    branch: str
    name: str
    changes: dict[str, tuple[int, int]] = field(default_factory=dict)  # mode -> (was, now) ranks
    comment: str | None = None
    id: str | None = None


def parse_tab(name: str, text: str) -> list[Row]:
    branch = branch_of_tab(name)
    if not branch:
        return []
    rows = list(csv.reader(io.StringIO(text)))
    # Find the "was / now" header row; the row above it names the modes.
    for h in range(1, min(len(rows), 6)):
        if any(c.strip().lower() == "was" for c in rows[h]):
            break
    else:
        return []
    labels, sub = rows[h - 1], rows[h]
    cols: list[tuple[int, list[str]]] = []
    comment_col = None
    for i, lab in enumerate(labels):
        if lab.strip().lower().startswith("comment"):
            comment_col = i
        elif lab.strip() and i + 1 < len(sub) and sub[i].strip().lower() == "was":
            cols.append((i, _modes(lab, branch)))
    out = []
    for r in rows[h + 1 :]:
        if not r or not r[0].strip():
            continue
        row = Row(branch, r[0].strip())
        for i, modes in cols:
            was, now = (
                (_rank(r[i]) if i < len(r) else None),
                (_rank(r[i + 1]) if i + 1 < len(r) else None),
            )
            if was is not None and now is not None and was != now:
                for m in modes:
                    row.changes[m] = (was, now)
        if comment_col is not None and comment_col < len(r) and r[comment_col].strip():
            row.comment = r[comment_col].strip()
        if row.changes:
            out.append(row)
    return out


# Nation suffixes the sheets use to tell same-named vehicles apart.
NATION_SUFFIX = {
    "usa": "usa", "germany": "germany", "ussr": "ussr", "great britain": "britain",
    "britain": "britain", "uk": "britain", "japan": "japan", "china": "china", "italy": "italy",
    "france": "france", "sweden": "sweden", "israel": "israel",
}  # fmt: skip
SUFFIX = re.compile(r"\s*\(([^()]+)\)\s*$")


# Suffixes that stand for one of the game's name glyphs.
GLYPH_SUFFIX = {"senrai maidens": "◍", "sm": "◍", "yt cup": "␙", "youtube cup": "␙"}


def split_nation(name: str) -> tuple[str, str | None]:
    """'F-16AM (France, Belgium)' -> ('F-16AM', 'france'); '(Senrai Maidens)' -> '◍' prefix."""
    m = SUFFIX.search(name)
    if not m:
        return name, None
    inner = m.group(1).strip().lower()
    if inner in GLYPH_SUFFIX:
        return GLYPH_SUFFIX[inner] + name[: m.start()], None
    first = inner.split(",")[0].strip()
    if first in NATION_SUFFIX:
        return name[: m.start()], NATION_SUFFIX[first]
    return name, None


# --- matching and outcomes ------------------------------------------------------------

OUTCOME_DAYS = 45


def br_at(history: list, date: str) -> tuple[int, int, int] | None:
    """(ab, rb, sb) in effect on `date` from a vehicle's history points, else its first BR."""
    best = None
    for h in history:
        if h.d <= date:
            best = h
    best = best or (history[0] if history else None)
    return (best.ab, best.rb, best.sb) if best else None


# SAM systems: tables name the system, the game names the launcher "X (TEL)".
TEL_SUFFIX = re.compile(r"\s*\((TEL|TELAR)\)\s*$")
# Aircraft tables also list helicopters.
TABLE_GROUP = {"ground": "ground", "air": "air", "heli": "air"}


def match_rows(
    rows: list[Row],
    date: str,
    details: dict,
    names: dict[str, list[str]],
    overrides: dict[tuple[str, str], list[str]] | None = None,
) -> None:
    """Fill Row.id (comma-joined ids when one row covers same-named copies)."""
    from .records import loose, norm

    overrides = overrides or {}
    by_key: dict[tuple[str, str], list[str]] = {}
    by_loose: dict[tuple[str, str], list[str]] = {}
    for uid, d in details.items():
        g = TABLE_GROUP[d.branch]
        for n in names.get(uid, []):
            for alias in {n, TEL_SUFFIX.sub("", n)}:
                by_key.setdefault((g, norm(alias)), []).append(uid)
                by_loose.setdefault((g, loose(alias)), []).append(uid)
    for r in rows:
        base, nation = split_nation(r.name)
        g = TABLE_GROUP[r.branch]
        if (r.branch, r.name) in overrides:
            found = overrides[(r.branch, r.name)]
        else:
            found = by_key.get((g, norm(r.name))) or by_key.get((g, norm(base))) or []
            if not found:
                found = by_loose.get((g, loose(base))) or []
        found = list(dict.fromkeys(found))
        if nation:
            # "Leopard 2A6 (Sweden)": the Swedish copy's name carries an operator glyph,
            # so try a glyph-blind match within that nation before falling back.
            found = (
                [u for u in found if details[u].nation == nation]
                or [u for u in by_loose.get((g, loose(base)), []) if details[u].nation == nation]
                or found
            )
            found = list(dict.fromkeys(found))
        if len(found) > 1:
            # Keep the copies whose BR on the day matches the table's "was".
            found = [u for u in found if _fits(details[u], r, date)] or found
        r.id = ",".join(found) if found else None
        if found:
            r.branch = details[found[0]].branch
    # "JH-7A" also matches "JH-7A Prototype"; when the post has its own row for a
    # vehicle, drop it from rows that only matched it by a shared name.
    single = {r.id for r in rows if r.id and "," not in r.id}
    for r in rows:
        if r.id and "," in r.id:
            ids = r.id.split(",")
            r.id = ",".join([u for u in ids if u not in single] or ids)


def _fits(d, r: Row, date: str) -> bool:
    at = br_at(d.history, date)
    modes = [m for m in ("ab", "rb", "sb") if m in r.changes]
    return bool(at) and all(at[("ab", "rb", "sb").index(m)] == r.changes[m][0] for m in modes)


def load_overrides(path: Path) -> dict[tuple[str, str], list[str]]:
    """etl/manual/official.toml: [branch] "Name in table" = "id" or ["id", ...]."""
    import tomllib

    if not path.exists():
        return {}
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    return {
        (branch, name): [ids] if isinstance(ids, str) else list(ids)
        for branch, names in data.items()
        for name, ids in names.items()
    }


def outcome(history: list, date: str, today: str, mode: str, was: int, now: int) -> str:
    """Planned change -> what the vehicle's BR did within OUTCOME_DAYS."""
    from datetime import date as d_
    from datetime import timedelta

    cutoff = (d_.fromisoformat(date) + timedelta(days=OUTCOME_DAYS)).isoformat()
    at = br_at(history, min(cutoff, today))
    if at is None:
        return "pending"
    value = at[("ab", "rb", "sb").index(mode)]
    if value == now:
        return "applied"
    if today < cutoff and value == was:
        return "pending"
    return "not_applied" if value == was else "different"
