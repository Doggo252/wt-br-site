from wtbr import armament


class FakeArsenal(armament.Arsenal):
    def __init__(self):
        super().__init__({}, {"gunmg17": "MG 17", "de_sc50": "SC50", "us_hydra": "Hydra"}, None)
        self.pods = {
            "pod7": {"blk": "x/rocketGuns/us_hydra.blk", "bullets": 7},
            "rack3": {"blk": "x/containers/pod7.blk", "bullets": 3},
        }

    def container(self, s):
        return self.pods.get(s)


def test_guns_presets_and_flares():
    fm = {
        "commonWeapons": {
            "Weapon": [
                {"trigger": "machine gun", "blk": "w/gunMG17.blk", "bullets": 500},
                {"trigger": "machine gun", "blk": "w/gunMG17.blk", "bullets": 500},
                {"trigger": "countermeasures", "blk": "w/flares.blk", "bullets": 30},
            ]
        },
        "weapon_presets": {
            "preset": [
                {"name": "default", "blk": "p/default.blk"},
                {"name": "4xSC50", "blk": "p/4xsc50.blk", "reqModification": ["a", "b"]},
            ]
        },
    }
    presets = {
        "p/4xsc50.blk": {
            "Weapon": [{"trigger": "bombs", "blk": "w/BombGuns/de_sc50.blk", "bullets": 1}] * 4
        }
    }
    a = armament.armament(fm, FakeArsenal(), presets.get, {"a": {"tier": 1}, "b": {"tier": 2}})
    assert [(g.name, g.count, g.ammo) for g in a.guns] == [("MG 17", 2, 500)]
    assert a.countermeasures == 30
    assert [(p.tier, [(i.name, i.count) for i in p.items]) for p in a.presets] == [
        (2, [("SC50", 4)])
    ]


def test_pylons_unwrap_pods_of_pods():
    fm = {
        "WeaponSlots": {
            "WeaponSlot": [
                {
                    "index": 1,
                    "WeaponPreset": [{"name": "r", "Weapon": {"blk": "x/containers/rack3.blk"}}],
                }
            ]
        }
    }
    a = armament.armament(fm, FakeArsenal(), lambda _: None, {})
    assert [(i.name, i.count) for i in a.pylons[0].options[0].items] == [("Hydra", 21)]
