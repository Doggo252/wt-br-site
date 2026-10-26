from wtbr import patchnotes as pn

INDEX = """
<div class="showcase__item widget">
  <a class="widget__link" href="/en/game/changelog/current/1911"></a>
  <div class="widget__poster"><img class="widget__poster-media js-lazy-load" data-src="https://x/img.jpg" alt=""></div>
  <div class="widget__content">
    <div class="widget__title">
        Update 2.59.0.78
    </div>
    <div class="widget__comment">
        JAS39A &mdash; fixed.
    </div>
    <ul class="widget__meta widget-meta"><li class="widget-meta__item widget-meta__item--right">
        21 October 2026
    </li></ul>
  </div>
</div>
"""

ARTICLE = """
<div class="g-grid"><figure class="e-figure"><img src="a.jpg"><figcaption>Art</figcaption></figure></div>
<p>Intro <b>bold</b> line.</p>
<h2><strong>Aircraft</strong></h2>
<ul>
  <li><strong>JAS39A, JAS39C (UK)</strong> — dispensers added. (<a href="https://community.gaijin.net/i/1"><strong>Report</strong></a>).</li>
  <li>Plain fix with <a href="javascript:alert(1)">bad link</a> and <script>x()</script>text.
    <ul><li>Nested detail</li></ul>
  </li>
</ul>
"""


def test_parse_index_reads_cards():
    (e,) = pn.parse_index(INDEX)
    assert e == {
        "id": 1911,
        "title": "Update 2.59.0.78",
        "summary": "JAS39A — fixed.",
        "date": "2026-10-21",
        "image": "https://x/img.jpg",
    }
    assert pn.version_of(e["title"]) == "2.59.0.78"
    assert pn.version_of('War Thunder "Sky Odyssey" - Changelog') is None


def test_parse_article_sections_items_and_sanitizing():
    intro, air = pn.parse_article(ARTICLE)
    assert intro.title is None
    assert intro.items[0].html == "Intro <strong>bold</strong> line."
    assert air.title == "Aircraft"
    first, plain, nested = air.items
    assert first.lead == "JAS39A, JAS39C (UK)"
    assert '<a href="https://community.gaijin.net/i/1"><strong>Report</strong></a>' in first.html
    assert "javascript" not in plain.html and "script" not in plain.html
    assert plain.lead == ""
    assert (nested.html, nested.depth) == ("Nested detail", 1)


def test_lead_names_split_and_countries():
    assert pn.lead_names("JAS39A, JAS39C (UK) and Leopard 2A6 (Sweden) —") == [
        ("JAS39A", None),
        ("JAS39C", "britain"),
        ("Leopard 2A6", "sweden"),
    ]
    assert pn.lead_names("M24 (all variants), T58") == [("M24", None), ("T58", None)]
