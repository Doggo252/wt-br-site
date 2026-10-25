def test_strip_svg_metadata():
    from wtbr.images import strip_svg_metadata

    svg = '<svg viewBox="0 0 1 1">\n  <metadata><x:xmpmeta>junk</x:xmpmeta></metadata>\n  <rect/></svg>'
    assert strip_svg_metadata(svg) == '<svg viewBox="0 0 1 1">\n  <rect/></svg>'
