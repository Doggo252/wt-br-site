"""Vehicle facts from the official wiki's unit pages (wiki.warthunder.com/unit/<id>).

The wiki shows figures the game files we read don't have in a usable form: stock as well as
upgraded engine power and flight performance for each mode, visibility, flight limits, crew and
talisman costs. It also lists each vehicle's Marketplace camouflages. Only these facts are kept;
the wiki's text stays on the wiki (it is Gaijin's, with no licence to republish).

robots.txt allows everything. Pages are re-read when older than MAX_AGE_DAYS, at most `limit` a
run, so the daily build spreads the work and the cache (kept between CI runs) fills over a few
days.
"""

import html
import json
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path

UNIT_URL = "https://wiki.warthunder.com/unit/{id}"
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"
MAX_AGE_DAYS = 14
WORKERS = 4
DELAY_S = 0.5

_HEADER = re.compile(r'class="block-header">([^<]*)<')
_LINE = re.compile(
    r'<div class="game-unit_chars-(?:subline|line)[^"]*">\s*<span[^>]*>(.*?)</span>\s*'
    r'<span class="game-unit_chars-value[^"]*">(.*?)</span>\s*</div>',
    re.S,
)
_MODE_SPAN = re.compile(r'<span class="show-char-([a-z-]+)[^"]*">([^<]*)</span>')
_CAMO = re.compile(
    r'href="https://trade\.gaijin\.net/market/1067/([^"?]+)[^"]*"[^>]*class="game-unit_camo"'
    r'[^>]*title="([^"]*)".*?<img src="([^"]+)"',
    re.S,
)


def _text(s: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())


def _number(s: str) -> float | None:
    s = s.replace(",", "").replace(" ", "").strip()
    try:
        return float(s)
    except ValueError:
        return None


def parse_unit(page: str) -> dict:
    """A unit page -> {"specs": [[section, label, value], ...], "camos": [...]}.

    A value is text, or for figures that differ by mode and upgrades, {key: [numbers]} with
    keys like "rb-mod-ref" (RB, upgraded), "rb-mod-basic" (RB, stock), "ab-mod-ref", or "rb" and
    "ab". Turret speeds list basic crew then aces."""
    headers = [(m.start(), _text(m.group(1))) for m in _HEADER.finditer(page)]
    specs = []
    for m in _LINE.finditer(page):
        section = next((h for pos, h in reversed(headers) if pos < m.start()), "")
        label = _text(m.group(1))
        by_mode: dict[str, list[float]] = {}
        for key, raw in _MODE_SPAN.findall(m.group(2)):
            n = _number(raw)
            if n is not None:
                by_mode.setdefault(key, []).append(n)
        specs.append([section, label, by_mode or _text(m.group(2))])
    camos = [
        {"item": item, "name": html.unescape(name), "image": image}
        for item, name, image in _CAMO.findall(page)
    ]
    return {"specs": specs, "camos": camos}


def _stock_upgraded(v: object) -> dict | None:
    """{"rb-mod-basic": [x], "rb-mod-ref": [y], ...} -> {"rb": (stock, upgraded), "ab": ...}.
    Turret speeds list basic crew then aces; the first (basic crew) is taken."""
    if not isinstance(v, dict):
        return None
    out = {}
    for mode in ("ab", "rb"):
        stock, upgraded = v.get(f"{mode}-mod-basic"), v.get(f"{mode}-mod-ref")
        if stock and upgraded:
            out[mode] = (stock[0], upgraded[0])
    return out or None


def _first_number(text: object) -> float | None:
    m = re.search(r"-?\d[\d,]*(?:\.\d+)?", text if isinstance(text, str) else "")
    return float(m[0].replace(",", "")) if m else None


def facts(page: dict) -> dict:
    """A parsed unit page -> the WikiFacts fields it has."""
    out: dict = {}
    mods: list[float] = []
    for section, label, value in page.get("specs", []):
        text = value if isinstance(value, str) else ""
        if label == "Engine power":
            out["enginePower"] = _stock_upgraded(value)
        elif label == "Power-to-weight ratio":
            out["powerToWeight"] = _stock_upgraded(value)
        elif label.startswith("Max speed at ") and section == "Flight performance":
            if "maxSpeed" not in out:
                out["maxSpeed"] = _stock_upgraded(value)
                out["maxSpeedAltM"] = _first_number(label)
        elif label == "Rate of Climb":
            out["climb"] = _stock_upgraded(value)
        elif label == "Turn time":
            out["turnTime"] = _stock_upgraded(value)
        elif label == "Visibility":
            n = _first_number(text)
            out["visibilityPct"] = int(n) if n is not None else None
        elif label == "Takeoff Run":
            out["takeoffRunM"] = _first_number(text)
        elif label == "Wing Loading":
            out["wingLoading"] = _first_number(text)
        elif label == "Wingspan":
            out["wingspanM"] = _first_number(text)
        elif label == "Length" and section == "General characteristics":
            out["lengthM"] = _first_number(text)
        elif label == "Max altitude":
            out["maxAltitudeM"] = _first_number(text)
        elif label == "Max Speed Limit (IAS)":
            out["speedLimitKmh"] = _first_number(text)
        elif label == "Mach Number Limit":
            out["machLimit"] = _first_number(text)
        elif label == "G limit":
            out["gLimit"] = text or None
        elif label == "Gear Speed Limit (IAS)":
            out["gearLimitKmh"] = _first_number(text)
        elif label.startswith("Flap Speed Limit"):
            out["flapLimits"] = text or None
        elif label == "Fuel in main tanks":
            out["fuel"] = text or None
        elif label == "Talisman cost":
            n = _first_number(text)
            out["talismanGe"] = int(n) if n is not None else None
        elif section == "Economy" and (
            label == "Total cost of modifications" or (not label and mods)
        ):
            n = _first_number(text)
            if n is not None and len(mods) < 2:
                mods.append(n)
    if mods:
        out["modsRp"] = int(mods[0])
        if len(mods) > 1:
            out["modsSl"] = int(mods[1])
    return {k: v for k, v in out.items() if v is not None}


def _get(url: str) -> str | None:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch(cache: Path, ids: list[str], limit: int = 1200) -> int:
    """Bring cache/<id>.json up to date for up to `limit` of the oldest or missing pages."""
    cache.mkdir(parents=True, exist_ok=True)
    now = datetime.now(UTC)

    def age(uid: str) -> datetime:
        path = cache / f"{uid}.json"
        if not path.exists():
            return datetime.min.replace(tzinfo=UTC)
        return datetime.fromisoformat(json.loads(path.read_text())["fetched"])

    stale = [u for u in ids if now - age(u) > timedelta(days=MAX_AGE_DAYS)]
    todo = sorted(stale, key=age)[:limit]

    def one(uid: str) -> bool:
        time.sleep(DELAY_S)
        try:
            page = _get(UNIT_URL.format(id=uid))
        except OSError as e:
            print(f"wiki: {uid}: {e}")
            return False
        data = parse_unit(page) if page else {"missing": True}
        data["fetched"] = datetime.now(UTC).isoformat(timespec="seconds")
        (cache / f"{uid}.json").write_text(json.dumps(data, ensure_ascii=False))
        return True

    done = 0
    with ThreadPoolExecutor(WORKERS) as pool:
        for i, ok in enumerate(pool.map(one, todo), 1):
            done += ok
            if i % 200 == 0:
                print(f"wiki: {i} of {len(todo)} pages", flush=True)
    return done


def load(cache: Path, uid: str) -> dict | None:
    path = cache / f"{uid}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    return None if data.get("missing") else data
