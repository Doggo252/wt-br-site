from wtbr import news

CARD = """
<a class="widget__link" href="/en/news/{id}-{slug}"></a>
<img class="widget__poster-media js-lazy-load" data-src="//staticfiles.warthunder.com/x.jpg" alt="" >
<div class="widget__title">{title}</div>
<div class="widget__comment">Summary text.</div>
<li class="widget-meta__item widget-meta__item--right">
    22 October 2026
</li>
"""


def test_parse_index_reads_kind_from_slug():
    page = CARD.format(id=10274, slug="development-pre-order-stingray-ii-en", title="Pre-order: X")
    page += CARD.format(id=7980, slug="video-the-shooting-range-330-en", title="The Shooting Range")
    a, b = news.parse_index(page)
    assert (a["id"], a["kind"], a["date"], a["image"]) == (
        10274, "devblog", "2026-10-22", "https://staticfiles.warthunder.com/x.jpg"
    )  # fmt: skip
    assert b["kind"] == "video"


def test_headline_mentions():
    names = news.vehicle_names(
        [
            ("leo", "Leopard 2A4"),
            ("leo_m", "Leopard 2A4M CAN"),
            ("chal", "Challenger"),  # one word, no digit: never matched
            ("j35", "J35A"),
            ("j35_copy", "▄J35A"),  # another tree's copy: the original wins
        ]
    )
    assert news.mentions("The Leopard 2A4M CAN and the J35A on sale", names) == ["leo_m", "j35"]
    assert news.mentions("Challenger League finals", names) == []
