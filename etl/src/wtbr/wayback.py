"""Old snapshots of the War Thunder wiki's battle rating lists, from the Internet Archive.

The datamine starts in March 2020. Before that, the wiki's "List of vehicle battle ratings"
pages were kept current by editors and the Wayback Machine has captured them since 2015, so
monthly captures give every vehicle's BR back to then. This module only downloads the raw
captures (one per month and page); parsing them is separate, so the slow, rate-limited part runs
once (see .github/workflows/wayback.yml) and the result is committed.
"""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

CDX = "https://web.archive.org/cdx/search/cdx"
RAW = "https://web.archive.org/web/{timestamp}id_/{url}"
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"
PAGES = ("wiki.warthunder.com/List_of_vehicle_battle_ratings*",)
BEFORE = "20200401"  # the datamine covers the rest
DELAY_S = 2.0


def _get(url: str, tries: int = 4) -> bytes:
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except OSError:
            if attempt == tries - 1:
                raise
            time.sleep(DELAY_S * 4 * (attempt + 1))
    raise AssertionError("unreachable")


def captures(pattern: str) -> list[dict]:
    """One successful capture per month per URL, oldest first."""
    query = urllib.parse.urlencode(
        {
            "url": pattern,
            "output": "json",
            "fl": "timestamp,original,statuscode,mimetype",
            "filter": ["statuscode:200", "mimetype:text/html"],
            "collapse": "timestamp:6",
            "to": BEFORE,
        },
        doseq=True,
    )
    rows = json.loads(_get(f"{CDX}?{query}"))
    head, rows = rows[0], rows[1:]
    out = [dict(zip(head, r, strict=True)) for r in rows]
    # Edit, history and other action URLs are not the page itself.
    return [c for c in out if "?" not in c["original"] and "action=" not in c["original"]]


def fetch(out: Path) -> int:
    """Download every capture into out/<timestamp>_<page>.html; returns how many are new."""
    out.mkdir(parents=True, exist_ok=True)
    index = []
    new = 0
    for pattern in PAGES:
        for c in captures(pattern):
            page = c["original"].rstrip("/").rsplit("/", 1)[-1].replace(":", "_")
            path = out / f"{c['timestamp']}_{page}.html"
            index.append({**c, "file": path.name})
            if path.exists():
                continue
            time.sleep(DELAY_S)
            try:
                path.write_bytes(_get(RAW.format(timestamp=c["timestamp"], url=c["original"])))
                new += 1
            except OSError as e:
                print(f"wayback: {c['timestamp']} {c['original']}: {e}")
    (out / "index.json").write_text(json.dumps(index, indent=1))
    return new
