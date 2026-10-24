import pytest

from wtbr.br import format_br, rank_to_br
from wtbr.thermals import thermal_gen


@pytest.mark.parametrize(
    ("rank", "expected"),
    [(0, "1.0"), (1, "1.3"), (2, "1.7"), (3, "2.0"), (15, "6.0"), (32, "11.7"), (33, "12.0")],
)
def test_format_br(rank, expected):
    assert format_br(rank) == expected


def test_negative_rank_rejected():
    with pytest.raises(ValueError):
        rank_to_br(-1)


@pytest.mark.parametrize(
    ("res", "gen"),
    [((500, 300), 1), ((800, 600), 2), ((1200, 800), 3), ((1600, 900), None)],
)
def test_thermal_gen(res, gen):
    assert thermal_gen(*res) == gen
