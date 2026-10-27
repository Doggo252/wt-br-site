"""Official patch notes from warthunder.com/en/game/changelog (back to December 2013).

The changelog index lists entries 12 per page, newest first; each entry's page holds the notes in
<section class="... article">. Entries rarely change once posted, so each is fetched once and the
article fragment cached as cache/patchnotes/<id>.html; the index is re-read until a page holds
nothing new. robots.txt allows /*/game/*.
"""

import html
import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

SITE = "https://warthunder.com"
INDEX_URL = SITE + "/en/game/changelog?page={page}"
ENTRY_URL = SITE + "/en/game/changelog/current/{id}"
USER_AGENT = "UptierBot/0.1 (+https://github.com/Doggo252/wt-br-site)"
# Fresh entries sometimes get corrected; refetch them for a few days.
REFRESH_DAYS = 3
DELAY_S = 0.3
WORKERS = 8

CARD = re.compile(
    r'href="/en/game/changelog/current/(\d+)".*?'
    r'(?:data-src="([^"]+)".*?)?'
    r'class="widget__title">\s*(.*?)\s*</div>.*?'
    r'class="widget__comment">\s*(.*?)\s*</div>.*?'
    r'widget-meta__item--right">\s*(.*?)\s*</li>',
    re.S,
)
ARTICLE = re.compile(r'<section class="section section--narrow article">(.*?)</section>', re.S)
VERSION = re.compile(r"\b(\d+\.\d+\.\d+\.\d+)\b")


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def _text(fragment: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def parse_index(page: str) -> list[dict]:
    out = []
    for m in CARD.finditer(page):
        entry_id, image, title, summary, date = m.groups()
        out.append(
            {
                "id": int(entry_id),
                "title": _text(title),
                "summary": _text(summary),
                "date": datetime.strptime(_text(date), "%d %B %Y").date().isoformat(),
                "image": image,
            }
        )
    return out


def fetch(cache: Path, max_pages: int = 400, full: bool = False) -> list[dict]:
    """Bring cache/patchnotes up to date. Returns the index, newest first.

    Requests take a few seconds each, so they run WORKERS at a time. The index is read in batches
    of pages until a batch brings nothing new (or, with `full`, to the end of the archive, which
    fills any gaps), and each entry is saved as soon as it arrives.
    """
    cache.mkdir(parents=True, exist_ok=True)
    index_path = cache / "index.json"
    index = {e["id"]: e for e in json.loads(index_path.read_text())} if index_path.exists() else {}

    def save_index() -> list[dict]:
        ordered = sorted(index.values(), key=lambda e: -e["id"])
        index_path.write_text(json.dumps(ordered, ensure_ascii=False))
        return ordered

    def page_entries(page: int) -> list[dict]:
        # An empty page normally means the end of the archive, but a failed or truncated response
        # looks the same; try a couple more times before believing it.
        for attempt in range(3):
            time.sleep(DELAY_S * (attempt + 1))
            try:
                entries = parse_index(_get(INDEX_URL.format(page=page)))
            except OSError:
                entries = []
            if entries:
                return entries
        return []

    today = datetime.now().date()

    def stale(e: dict) -> bool:
        fresh = (today - datetime.fromisoformat(e["date"]).date()).days <= REFRESH_DAYS
        return fresh or not (cache / f"{e['id']}.html").exists()

    def fetch_entry(e: dict) -> None:
        time.sleep(DELAY_S)
        m = ARTICLE.search(_get(ENTRY_URL.format(id=e["id"])))
        (cache / f"{e['id']}.html").write_text(m.group(1) if m else "", encoding="utf-8")

    with ThreadPoolExecutor(WORKERS) as pool:
        for first in range(1, max_pages + 1, WORKERS):
            pages = range(first, min(first + WORKERS, max_pages + 1))
            results = list(pool.map(page_entries, pages))
            new = [e for entries in results for e in entries if e["id"] not in index]
            for entries in results:
                index.update((e["id"], e) for e in entries)
            save_index()
            if (not new and not full) or not all(results):
                break
        list(pool.map(fetch_entry, [e for e in index.values() if stale(e)]))
    ordered = save_index()
    index_path.write_text(json.dumps(ordered, ensure_ascii=False))
    return ordered


def load(cache: Path) -> list[dict]:
    """Cached index entries with their article fragments, newest first."""
    index_path = cache / "index.json"
    if not index_path.exists():
        return []
    out = []
    for e in json.loads(index_path.read_text()):
        path = cache / f"{e['id']}.html"
        if path.exists():
            out.append({**e, "html": path.read_text(encoding="utf-8")})
    return out


def version_of(title: str) -> str | None:
    m = VERSION.search(title)
    return m.group(1) if m else None


# --- article parsing --------------------------------------------------------------


@dataclass
class Item:
    html: str
    depth: int = 0
    lead: str = ""  # the bold text an item starts with: usually vehicle names


@dataclass
class Section:
    title: str | None
    items: list[Item] = field(default_factory=list)


class _Article(HTMLParser):
    """Headings start sections; list items and paragraphs become items. Item markup is reduced
    to <strong>, <em> and <a href="http(s)://...">; images, figures and everything else drop out."""

    INLINE = {"strong": "strong", "b": "strong", "em": "em", "i": "em"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.sections: list[Section] = [Section(None)]
        self.depth = -1  # list nesting
        self.buf: list[str] | None = None  # open item's markup
        self.lead: list[str] | None = None
        self.lead_done = False
        self.stack: list[str] = []  # open inline tags in the buffer
        self.heading: list[str] | None = None
        self.skip = 0  # inside figure/script/style

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("figure", "script", "style", "figcaption"):
            self.skip += 1
        if self.skip:
            return
        if tag in ("h1", "h2", "h3", "h4"):
            self._flush()
            self.heading = []
        elif tag in ("ul", "ol"):
            self._flush()
            self.depth += 1
        elif tag in ("li", "p"):
            self._flush()
            self.buf, self.lead, self.lead_done, self.stack = [], [], False, []
        elif tag == "br" and self.buf is not None:
            self.buf.append("<br>")
        elif self.buf is not None and tag in self.INLINE:
            t = self.INLINE[tag]
            self.buf.append(f"<{t}>")
            self.stack.append(t)
        elif self.buf is not None and tag == "a":
            href = a.get("href") or ""
            if href.startswith("/"):
                href = SITE + href
            if href.startswith(("https://", "http://")):
                self.buf.append(f'<a href="{html.escape(href, quote=True)}">')
                self.stack.append("a")
            else:
                self.stack.append("")

    def handle_endtag(self, tag):
        if tag in ("figure", "script", "style", "figcaption"):
            self.skip = max(0, self.skip - 1)
            return
        if self.skip:
            return
        if tag in ("h1", "h2", "h3", "h4") and self.heading is not None:
            title = " ".join("".join(self.heading).split())
            self.heading = None
            if title:
                self.sections.append(Section(title))
        elif tag in ("ul", "ol"):
            self._flush()
            self.depth = max(-1, self.depth - 1)
        elif tag in ("li", "p"):
            self._flush()
        elif self.buf is not None and self.stack and tag in (*self.INLINE, "a"):
            t = self.stack.pop()
            if t:
                self.buf.append(f"</{t}>")
            if t == "strong" and self.lead and not self.stack:
                self.lead_done = True

    def handle_data(self, data):
        if self.skip:
            return
        if self.heading is not None:
            self.heading.append(data)
        elif self.buf is not None:
            self.buf.append(html.escape(data, quote=False))
            if not self.lead_done:
                if "strong" in self.stack:
                    self.lead.append(data)
                elif data.strip():
                    self.lead_done = True

    def _flush(self):
        if self.buf is None:
            return
        for t in reversed(self.stack):
            if t:
                self.buf.append(f"</{t}>")
        text = re.sub(r"\s+", " ", "".join(self.buf)).strip()
        if re.sub(r"<[^>]+>", "", text).strip():
            self.sections[-1].items.append(
                Item(text, max(0, self.depth), " ".join("".join(self.lead or []).split()))
            )
        self.buf, self.lead, self.stack = None, None, []


def parse_article(fragment: str) -> list[Section]:
    p = _Article()
    p.feed(fragment)
    p._flush()
    return [s for s in p.sections if s.items]


# --- vehicle mentions ----------------------------------------------------------------

COUNTRY_SUFFIX = re.compile(r"\s*\(([^)]+)\)\s*$")
COUNTRY = {
    "usa": "usa", "us": "usa", "germany": "germany", "ussr": "ussr", "uk": "britain",
    "great britain": "britain", "britain": "britain", "japan": "japan", "china": "china",
    "italy": "italy", "france": "france", "sweden": "sweden", "israel": "israel",
}  # fmt: skip


# "(all variants)" means every copy of the vehicle, whatever the nation.
ALL_VARIANTS = {"all variants", "all modifications", "all versions"}


def lead_names(lead: str) -> list[tuple[str, str | None]]:
    """'JAS39A, JAS39C (UK), JAS39EBS HU C (Italy)' -> [(name, nation or None), ...]."""
    lead = lead.strip().rstrip("—–-:").strip()
    out = []
    for part in re.split(r",\s*|\s+and\s+|;\s*", lead):
        part = part.strip()
        if not part:
            continue
        nation = None
        m = COUNTRY_SUFFIX.search(part)
        if m and m.group(1).lower() in COUNTRY:
            nation = COUNTRY[m.group(1).lower()]
            part = part[: m.start()].strip()
        elif m and m.group(1).lower() in ALL_VARIANTS:
            part = part[: m.start()].strip()
        out.append((part, nation))
    return out


# --- battle rating changes in old changelogs ---------------------------------------------
# Before the datamine (March 2020) the changelogs are the only record of BR changes. They come
# as "AMX-30 (1972) - BR in all modes has been reduced from 7.7 to 7.3", "BR for the Cromwell
# Mk V has been increased from 2.7 to 3.0 in all game modes", or a vehicle name followed by
# "AB: 3.0 → 3.3" lines.

_NUM = r"(\d{1,2}\.\d)"
_ARROW = r"\s*(?:→|->|>|to)\s*"
_MODE_WORDS = {
    "ab": "ab", "arcade": "ab", "rb": "rb", "realistic": "rb", "historical": "rb",
    "sb": "sb", "simulator": "sb", "simulation": "sb", "full real": "sb",
}  # fmt: skip
_MODE = r"(AB|RB|SB|arcade|realistic|historical|simulator|simulation|full real)"
_MODE_PAIR = re.compile(_MODE + r"\b[^0-9]{0,40}?" + _NUM + _ARROW + _NUM, re.I)
_FROM_TO = re.compile(r"from\s+" + _NUM + r"\s+to\s+" + _NUM, re.I)
_ALL_MODES = re.compile(r"\ball\b[^.;]{0,20}\bmodes?\b|\bin all\b", re.I)
_BR = r"(?:BR|battle ratings?|economic rank)"
_NAME_FIRST = re.compile(
    r"^(?P<names>[^.]+?)\s*(?:[-–—:]|\bhas\b|\bhave\b)\s*(?:the\s+)?" + _BR, re.I
)
_BR_OF = re.compile(
    _BR + r"\s+(?:for|of)\s+(?:the\s+)?(?P<names>.+?)\s+(?:has|have)\s+been\b", re.I
)
_DROP = re.compile(
    r"\((?:and )?(?:its|their) premium (?:counterparts?|versions?)\)|\bgerman\s+", re.I
)


def _plain_text(fragment: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def _modes(text: str) -> dict[str, tuple[float, float]]:
    """Mode -> (was, now) for every change a sentence states; "br" when no mode is named."""
    out: dict[str, tuple[float, float]] = {}
    for m in _MODE_PAIR.finditer(text):
        out[_MODE_WORDS[m.group(1).lower()]] = (float(m.group(2)), float(m.group(3)))
    if out:
        return out
    m = _FROM_TO.search(text)
    if not m:
        return {}
    pair = (float(m.group(1)), float(m.group(2)))
    if _ALL_MODES.search(text):
        return {"ab": pair, "rb": pair, "sb": pair}
    return {"br": pair}


_STARTS_WITH_MODE = re.compile(r"^\s*" + _MODE + r"\b", re.I)


def br_changes(sections: list[Section]) -> list[tuple[list[tuple[str, str | None]], dict]]:
    """(vehicle names, {mode: (was, now)}) for each BR change stated in a changelog. A line
    holding only names ("P-47D-25:") names the vehicle for the "AB: 3.0 → 3.3" lines after it."""
    out: list[tuple[list[tuple[str, str | None]], dict]] = []
    current: list[tuple[str, str | None]] = []
    for sec in sections:
        for it in sec.items:
            text = _plain_text(it.html)
            rest = (
                text[len(it.lead) :].strip(" :-–—")
                if it.lead and text.startswith(it.lead)
                else text
            )
            if it.lead and not rest:
                current = lead_names(it.lead)
                continue
            modes = _modes(text)
            if not modes:
                if len(text) < 60 and not re.search(r"\d\.\d", text) and text.endswith(":"):
                    current = lead_names(text)
                continue
            names = None
            if _STARTS_WITH_MODE.match(text):
                names = current
            elif m := _NAME_FIRST.search(text):
                names = lead_names(_DROP.sub("", m.group("names")))
            elif (m := _BR_OF.search(text)) and not m.group("names").lower().startswith("all "):
                names = lead_names(_DROP.sub("", m.group("names")))
            elif it.lead:
                names = lead_names(it.lead)
            if not names:
                continue
            if out and out[-1][0] == names and not set(out[-1][1]) & set(modes):
                out[-1][1].update(modes)
            else:
                out.append((names, dict(modes)))
    return out
