---
title: First-Stage Ammo Stowage
summary: How ready racks give tanks their fastest reload, what happens when they run dry, how they refill, and how to check yours.
source: https://wiki.warthunder.com/mechanics/5191-the-secrets-of-first-stage-ammo-stowage
---

Many tanks keep a few rounds right next to the loader or the loading mechanism. These are the first-stage rounds, also called the ready rack or first-order ammo, and they give the fastest possible reload. Once they are used up, a manually loaded gun slows down and an autoloaded one stops firing altogether, so knowing how big your ready rack is and how it refills can decide a duel.

## Manual ready racks versus autoloaders

The two systems behave differently, and they should not be confused:

| | Manual ready rack | Autoloader |
|---|---|---|
| Reload speeds | Two: fast while the ready rack has rounds, slower once it is empty | One |
| When the ready rack is empty | You can still reload, just more slowly | You cannot fire until at least one round has been moved back into it |
| Affected by crew skill and crew damage | Yes | No |

The slower manual reload represents the loader having to reach for rounds stowed further away. Note that the reload time on a vehicle's stat card is the fast one, from the ready rack.

What both systems share is that the ready rack is always filled before any other rack. If you bring exactly as many rounds as the ready rack holds, nothing else gets loaded. That usually helps survivability, at the risk of running short in a long fight. For more on loading mechanisms, see the [autoloader](/guide/mechanics/autoloader/) page.

## Checking what your tank has

### In the hangar

This is the best method, because it also tells you how many rounds fill the ready rack, so you can choose your ammo count precisely. Switch to X-ray view and hover over the gun breech:

- **"First-stage ammo stowage"** on its own, with a round count, means a manual ready rack.
- **"Automatic loading"** means an autoloader.
- **Neither** means the tank has no ready rack.

The ammo stowages carry similar descriptions if you hover over them, and autoloaders also have a large mechanism labelled "Autoloader".

### In battle

The number of rounds left in the first stage is shown in the bottom-left corner of the screen. Keep an eye on it: when it reaches 0, the next reload on a manual loader will be noticeably longer, and an autoloader will stop firing. If there is no counter, your tank has no ready rack. Autoloaders show the same counter, so check in the hangar if you are not sure which system you have.

## How the ready rack refills

The same rules apply to both systems:

- After you fire, the crew first waits for the next ready-rack round to be loaded. A few seconds later they start moving rounds from the other racks into the ready rack, as long as it is not empty.
- A timer appears for each round being moved across.
- Firing resets that timer. If you keep shooting, or if there is nothing left to move, the timer never shows.
- How long each round takes varies from tank to tank, with no obvious pattern.

The only difference comes when the ready rack hits zero. A manually loaded tank reloads the gun first and only then starts refilling. An autoloader cannot load the gun, so it goes straight to refilling. Some vehicles, like the 2S19M2, carry no ammunition outside the ready rack or autoloader at all, so they never see the refill timer.

### Refilling at a capture point

A friendly capture point restocks your ammunition. Sit still on it and a reload icon appears; each time it completes, you get one round back. Those rounds go straight into the ready rack if you have one, and it is quicker than waiting for the crew to shuffle rounds across. If your ready rack is low, the nearest friendly point is the fastest fix.

## Making the most of it

- **Max out your crew skills** to get the shortest possible reload from a manual ready rack.
- **Learn where the ready rack sits** on your tank and on the enemy's. It is almost always full, which makes it a reliable one-shot target. If you know the order racks empty in, you can pick shots that are sure to hit a partly filled one.
- **Small ready racks need care.** The T25 has just 2 first-order rounds, so firing them off carelessly costs you precious seconds on the next reload.
- **Large ready racks are forgiving.** Cold War tanks and later often have so much room that you never run dry. The M60A1 (AOS) holds 37 first-order rounds. There is no need to carry far more than that and make yourself more vulnerable.

## Finding the exact numbers

The game does not show refill times, but they can be read from the game files. A community datamine of those files is published on GitHub by the volunteer gszabi99. Because it is not maintained by Gaijin, it can lag behind major updates. The timing values can be checked by timing them yourself in game; the others cannot, so do not trust them blindly.

Tank files live under `aces.vromfs.bin_u/gamedata/units/tankmodels/` and are named after the vehicle's internal ID, which is also the last part of its address on our vehicle pages. The M1128, for example, is `us_m1128_mgs.blkx`. Open the file, search for `ammoStowages`, and look for these values:

| Value | What it tells you |
|---|---|
| `firstStage` | Present when the tank has a manual ready rack |
| `autoLoad` | Set to true when the tank has an autoloader |
| `replenishmentDelay` | Seconds after firing before the ready rack starts refilling |
| `replenishmentTime` | Seconds to move a single round into the ready rack |
| `reloadTimeMult` | The multiplier applied to your reload once a manual ready rack is empty (not used by autoloaders) |

A tank with neither `firstStage` nor `autoLoad` has no ready rack. The two refill times vary a lot between tanks, so they are worth checking if you often run your ready rack dry.
