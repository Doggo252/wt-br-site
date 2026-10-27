"""News and devblogs from warthunder.com/en/news (robots.txt allows /*/news/*).

Only the index is read: title, summary, date, image and link for each post. Articles stay on
warthunder.com; the site links to them. The index lists about 18 posts a page, newest first, and
is re-read until a batch of pages brings nothing new (or, with `full`, to the end).
"""

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

from .patchnotes import SITE, _get, _text
from .records import CYRILLIC_LOOKALIKES, GLYPHS

INDEX_URL = SITE + "/en/news/?page={page}"
MAX_PAGES = 120  # about three years of posts
DELAY_S = 0.3
WORKERS = 8

CARD = re.compile(
    r'href="/en/news/(\d+)-([a-z0-9\-]*)".*?'
    r'(?:data-src="([^"]+)".*?)?'
    r'class="widget__title">\s*(.*?)\s*</div>.*?'
    r'(?:class="widget__comment">\s*(.*?)\s*</div>.*?)?'
    r'widget-meta__item--right">\s*(.*?)\s*</li>',
    re.S,
)

# The first word of the slug is the post's category ("10279-development-improvements-to-dircm-en").
KINDS = {
    "development": "devblog",
    "shop": "shop",
    "event": "event",
    "esports": "esports",
    "video": "video",
    "fixed": "fixes",
    "it-s-fixed": "fixes",
    "update": "update",
    "special": "special",
    "warbonds": "event",
    "decals": "community",
    "community": "community",
}


def kind_of(slug: str) -> str:
    for prefix, kind in KINDS.items():
        if slug.startswith(prefix + "-"):
            return kind
    return "news"


def parse_index(page: str) -> list[dict]:
    out = []
    for m in CARD.finditer(page):
        post_id, slug, image, title, summary, date = m.groups()
        try:
            day = datetime.strptime(_text(date), "%d %B %Y").date().isoformat()
        except ValueError:
            continue
        out.append(
            {
                "id": int(post_id),
                "slug": slug,
                "title": _text(title),
                "summary": _text(summary or ""),
                "date": day,
                "image": ("https:" + image) if image and image.startswith("//") else image,
                "kind": kind_of(slug),
            }
        )
    return out


def fetch(cache: Path, max_pages: int = MAX_PAGES, full: bool = False) -> list[dict]:
    """Bring cache/index.json up to date. Returns the index, newest first."""
    cache.mkdir(parents=True, exist_ok=True)
    path = cache / "index.json"
    index = {e["id"]: e for e in json.loads(path.read_text())} if path.exists() else {}

    def page_entries(page: int) -> list[dict]:
        # An empty page normally means the end, but a failed request looks the same: retry.
        for attempt in range(3):
            time.sleep(DELAY_S * (attempt + 1))
            try:
                entries = parse_index(_get(INDEX_URL.format(page=page)))
            except OSError:
                entries = []
            if entries:
                return entries
        return []

    with ThreadPoolExecutor(WORKERS) as pool:
        for first in range(1, max_pages + 1, WORKERS):
            results = list(
                pool.map(page_entries, range(first, min(first + WORKERS, max_pages + 1)))
            )
            new = [e for entries in results for e in entries if e["id"] not in index]
            for entries in results:
                index.update((e["id"], e) for e in entries)
            ordered = sorted(index.values(), key=lambda e: -e["id"])
            path.write_text(json.dumps(ordered, ensure_ascii=False))
            if (not new and not full) or not all(results):
                break
    return sorted(index.values(), key=lambda e: -e["id"])


def load(cache: Path) -> list[dict]:
    path = cache / "index.json"
    return json.loads(path.read_text()) if path.exists() else []


def _plain(name: str) -> str:
    return " ".join(GLYPHS.sub("", name.translate(CYRILLIC_LOOKALIKES)).split())


def vehicle_names(units: list[tuple[str, str]]) -> dict[str, str]:
    """(id, name) -> {lower-cased name: id} for names that point at one vehicle. Copies in other
    trees carry a glyph; the plain-named original wins. One-word names without a digit
    ("Challenger", "Stingray") are left out: too likely to be ordinary words in a headline."""
    by_name: dict[str, list[tuple[str, bool]]] = {}
    for uid, name in units:
        plain = _plain(name)
        if len(plain) < 3 or (" " not in plain and not re.search(r"\d", plain)):
            continue
        by_name.setdefault(plain.lower(), []).append((uid, plain != name.strip()))
    out = {}
    for key, ids in by_name.items():
        originals = [uid for uid, copy in ids if not copy]
        if len(originals) == 1:
            out[key] = originals[0]
        elif not originals and len(ids) == 1:
            out[key] = ids[0][0]
    return out


# Kinds whose headlines name vehicles; esports and videos mostly name teams and shows.
VEHICLE_KINDS = {"devblog", "event", "shop", "special", "update", "news"}


def mentions(title: str, names: dict[str, str]) -> list[str]:
    """Vehicles named in a headline, longest names first so "Leopard 2A4M" beats "Leopard 2A4"."""
    text = " " + _plain(title).lower() + " "
    found: list[str] = []
    for key in sorted(names, key=len, reverse=True):
        m = re.search(r"(?<![\w-])" + re.escape(key) + r"(?![\w-])", text)
        if m and names[key] not in found:
            found.append(names[key])
            text = text[: m.start()] + " " * len(key) + text[m.end() :]
    return found
