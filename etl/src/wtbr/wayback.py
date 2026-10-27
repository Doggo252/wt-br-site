"""Old snapshots of the War Thunder wiki's battle rating lists, from the Internet Archive.

The datamine starts in March 2020. Before that, the wiki's "List of vehicle battle ratings"
pages were kept current by editors and the Wayback Machine has captured them since 2015, so
monthly captures give every vehicle's BR back to then. This module only downloads the raw
captures (one per month and page); parsing them is separate, so the slow, rate-limited part runs
once (see .github/workflows/wayback.yml) and the result is committed.
"""

import json
import re
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


PROBES = {
    "list_exact": "wiki.warthunder.com/List_of_vehicle_battle_ratings",
    "list_prefix": "wiki.warthunder.com/List_of_vehicle_battle_ratings*",
    "list_index_php": "wiki.warthunder.com/index.php?title=List_of_vehicle_battle_ratings*",
    "battle_rating": "wiki.warthunder.com/Battle_rating*",
    "wiki_all": "wiki.warthunder.com/*",
}


def probe(out: Path) -> None:
    """Dump the raw capture lists (successful HTML captures before BEFORE, deduplicated by
    content) for a few URL patterns, to see what the archive holds."""
    out.mkdir(parents=True, exist_ok=True)
    for name, pattern in PROBES.items():
        query = urllib.parse.urlencode(
            {
                "url": pattern,
                "fl": "timestamp,original,statuscode,length",
                "filter": ["statuscode:200"],
                "collapse": "digest",
                "to": BEFORE,
            },
            doseq=True,
        )
        try:
            (out / f"cdx_{name}.txt").write_bytes(_get(f"{CDX}?{query}"))
        except OSError as e:
            print(f"wayback probe {name}: {e}")
        time.sleep(DELAY_S)


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


# --- vehicle pages -------------------------------------------------------------------------
# The archive holds about 10,000 captures of wiki vehicle pages from 2019 (almost none before).
# Each page's infobox shows the BR at capture time; only that part is kept. The archive is slow
# (about 7 pages a minute from one machine), so the work can be split into shards that run side
# by side, and resumed after a page.

SNIPPET_CHARS = 4000
WORKERS = 4
# Wiki pages that are not vehicles: guns, torpedoes and bombs ("2A26 (125 mm)"), maps.
NOT_VEHICLE = re.compile(r"_\(\d+(?:[.,]\d+)?_(?:mm|kg|lb)\)$|_Map$")


def _vehicle_page(url: str) -> str | None:
    path = urllib.parse.unquote(urllib.parse.urlsplit(url).path.lstrip("/"))
    if urllib.parse.urlsplit(url).query or not path or ":" in path or NOT_VEHICLE.search(path):
        return None
    if path.startswith(("index.php", "images", "load.php", "skins", "extensions", "api.php")):
        return None
    return path


def _snippet(page: str) -> str | None:
    """The infobox part of a vehicle page: from the first "Battle rating" on."""
    i = page.find("Battle rating")
    if i < 0:
        i = page.find("battle rating")
    return page[max(0, i - 500) : i + SNIPPET_CHARS] if i >= 0 else None


def page_captures(rows: list[list[str]], after: str | None = None) -> list[tuple[str, str, str]]:
    """CDX rows (timestamp, url) -> (timestamp, url, page) for vehicle pages, one capture per
    page and month, in the archive's order. With `after`, only the pages listed after it."""
    todo, seen = [], set()
    for ts, url in rows:
        page = _vehicle_page(url)
        if page and (page, ts[:6]) not in seen:
            seen.add((page, ts[:6]))
            todo.append((ts, url, page))
    if after:
        last = max((i for i, t in enumerate(todo) if t[2] == after), default=None)
        if last is None:
            print(f"wayback: {after!r} is not in the capture list; fetching everything")
        else:
            todo = todo[last + 1 :]
    return todo


def fetch_pages(out: Path, after: str | None = None, shard: int = 0, shards: int = 1) -> int:
    """Infobox snippets of pre-2020 wiki page captures into out/pages.jsonl: this shard's share
    of the pages (split by page, so one page's captures stay together)."""
    from concurrent.futures import ThreadPoolExecutor

    out.mkdir(parents=True, exist_ok=True)
    query = urllib.parse.urlencode(
        {
            "url": "wiki.warthunder.com/*",
            "fl": "timestamp,original",
            "filter": ["statuscode:200", "mimetype:text/html"],
            "collapse": "digest",
            "to": BEFORE,
        },
        doseq=True,
    )
    rows = [line.split() for line in _get(f"{CDX}?{query}").decode().splitlines() if line.strip()]
    todo = page_captures([r for r in rows if len(r) == 2], after)
    pages = sorted({t[2] for t in todo})
    mine = {p for i, p in enumerate(pages) if i % shards == shard}
    todo = [t for t in todo if t[2] in mine]
    done_path = out / "pages.jsonl"
    done = set()
    if done_path.exists():
        done = {(r["ts"], r["page"]) for r in map(json.loads, done_path.read_text().splitlines())}
    todo = [t for t in todo if (t[0], t[2]) not in done]
    print(f"wayback: {len(todo)} page captures to fetch", flush=True)

    def one(t: tuple[str, str, str]) -> dict | None:
        ts, url, page = t
        time.sleep(DELAY_S / 2)
        try:
            body = _get(RAW.format(timestamp=ts, url=url)).decode("utf-8", "replace")
        except OSError:
            return None
        snip = _snippet(body)
        return {"ts": ts, "page": page, "snippet": snip} if snip else {"ts": ts, "page": page}

    n = 0
    with ThreadPoolExecutor(WORKERS) as pool, done_path.open("a") as f:
        for rec in pool.map(one, todo):
            if rec:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                f.flush()  # a job stopped at its time limit keeps what it has
                n += 1
                if n % 100 == 0:
                    print(f"wayback: {n} of {len(todo)}", flush=True)
    return n


_SEP = r'</span><span class="ttx-unvisible ttx-value">/</span>'
INFOBOX_BR = re.compile(
    rf'ttx-sb ttx-value">([\d.]+){_SEP}<span class="ttx-rb ttx-value">([\d.]+){_SEP}'
    r'<span class="ttx-ab ttx-value">([\d.]+)</span><span class="ttx-name">'
    r'<span title="Battle ratings"'
)
PAGE_URL = "https://web.archive.org/web/{ts}/https://wiki.warthunder.com/{page}"


def parse_infobox(snippet: str) -> tuple[float, float, float] | None:
    """The infobox's BR line -> (ab, rb, sb). The wiki lays the modes out right to left."""
    m = INFOBOX_BR.search(snippet)
    return (float(m[3]), float(m[2]), float(m[1])) if m else None


def _runs(seq: list[tuple[str, tuple]]) -> list[list]:
    """Sorted (timestamp, br) -> the first and last capture of each run with the same BR."""
    return [
        [ts, *br]
        for i, (ts, br) in enumerate(seq)
        if i in (0, len(seq) - 1) or seq[i - 1][1] != br or seq[i + 1][1] != br
    ]


def page_series(records: list[dict], known: dict[str, list[list]] | None = None) -> dict:
    """pages.jsonl records -> {page: [[timestamp, ab, rb, sb], ...]}, oldest first, merged into
    `known` (an earlier result). Of each run of captures with the same BR only the first and
    last are kept: enough to date a change to the time between them."""
    obs: dict[str, dict[str, tuple]] = {}
    for page, rows in (known or {}).items():
        obs[page] = {ts: tuple(br) for ts, *br in rows}
    for r in records:
        br = parse_infobox(r.get("snippet") or "")
        if br:
            obs.setdefault(r["page"], {})[r["ts"]] = br
    return {page: _runs(sorted(by_ts.items())) for page, by_ts in sorted(obs.items())}


# --- BR change lists ------------------------------------------------------------------------
# Before 2020 most BR changes were published as Google Sheets or old-forum threads linked from
# the changelog. Many sheets have since been made private and the old forum is gone, but the
# archive kept copies. `fetch_urls` saves the latest pre-2021 capture of each listed URL, plus
# every archived old-forum thread whose address says it is about battle ratings.

FORUM_TOPICS = "forum.warthunder.com/index.php?/topic/*"
FORUM_BR = r".*topic/[0-9]+-[^/]*(battle-rating|br-change|br-and|planned-br|-brs-)[^/]*/?$"


def _latest(url: str) -> dict | None:
    """The newest successful capture of exactly this URL before 2021."""
    query = urllib.parse.urlencode(
        {"url": url, "output": "json", "fl": "timestamp,original", "filter": "statuscode:200",
         "to": "2021", "limit": "-1"},
        doseq=True,
    )  # fmt: skip
    rows = json.loads(_get(f"{CDX}?{query}") or b"[]")
    return dict(zip(rows[0], rows[-1], strict=True)) if len(rows) > 1 else None


def _variants(url: str) -> list[str]:
    """Sheet links were shared with and without a "/u/N" account part; try both."""
    bare = re.sub(r"/spreadsheets/u/\d+/", "/spreadsheets/", url)
    return list(dict.fromkeys([url, bare, bare.split("?")[0]]))


def forum_br_topics() -> list[str]:
    query = urllib.parse.urlencode(
        {
            "url": FORUM_TOPICS,
            "fl": "original",
            "filter": ["statuscode:200", f"original:{FORUM_BR}"],
            "collapse": "urlkey",
            "to": "2021",
        },
        doseq=True,
    )
    lines = _get(f"{CDX}?{query}").decode().splitlines()
    topics = {
        line.strip().split("?/topic/")[-1].split("/")[0] for line in lines if "?/topic/" in line
    }
    return sorted(f"https://forum.warthunder.com/index.php?/topic/{t}/" for t in topics if t)


def fetch_urls(listing: Path, out: Path) -> int:
    """Save the latest archived copy of each URL in `listing` (tab-separated date, note id, URL;
    # comments) and of every old-forum BR thread into out/, indexed in out/urls.json."""
    out.mkdir(parents=True, exist_ok=True)
    rows = [
        line.split("\t")
        for line in listing.read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ]
    wanted = [(date, note, url) for date, note, url in rows]
    try:
        wanted += [("", "", u) for u in forum_br_topics()]
    except OSError as e:
        print(f"wayback: forum topic search failed: {e}", flush=True)
    index, n = [], 0
    for date, note, url in wanted:
        cap = None
        for v in _variants(url):
            try:
                cap = _latest(v)
            except OSError as e:
                print(f"wayback: {v}: {e}", flush=True)
            if cap:
                break
            time.sleep(DELAY_S)
        entry = {"date": date, "note": note, "url": url}
        if cap:
            name = re.sub(r"[^A-Za-z0-9]+", "_", url.split("//", 1)[-1])[:150] + ".html"
            try:
                body = _get(RAW.format(timestamp=cap["timestamp"], url=cap["original"]))
                (out / name).write_bytes(body)
                entry.update(file=name, timestamp=cap["timestamp"])
                n += 1
            except OSError as e:
                print(f"wayback: {url}: {e}", flush=True)
        index.append(entry)
        print(f"wayback: {'saved' if 'file' in entry else 'no capture'} {url}", flush=True)
        time.sleep(DELAY_S)
    (out / "urls.json").write_text(json.dumps(index, indent=1))
    return n


# --- parsing --------------------------------------------------------------------------------

WIKI_COUNTRIES = {
    "USA": "usa", "Germany": "germany", "USSR": "ussr", "Great Britain": "britain",
    "Britain": "britain", "Japan": "japan", "Italy": "italy", "France": "france",
    "China": "china", "Sweden": "sweden", "Israel": "israel",
}  # fmt: skip


def parse_list(page: str) -> list[list]:
    """The wiki list page's tables -> [[nation, name, ab, rb, sb], ...] (BR as numbers)."""
    import html as html_lib

    out = []
    for table in re.findall(r"<table.*?</table>", page, re.S):
        for row in re.findall(r"<tr.*?</tr>", table, re.S):
            cells = [
                " ".join(html_lib.unescape(re.sub(r"<[^>]+>", " ", c)).split())
                for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", row, re.S)
            ]
            if len(cells) < 5 or cells[0] not in WIKI_COUNTRIES:
                continue
            try:
                brs = [float(c) for c in cells[2:5]]
            except ValueError:
                continue
            out.append([WIKI_COUNTRIES[cells[0]], cells[1], *brs])
    return out
