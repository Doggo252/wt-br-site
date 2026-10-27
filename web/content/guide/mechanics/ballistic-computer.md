---
title: Ballistic Computer
summary: Using CCIP and CCRP to put unguided guns, rockets and bombs on ground targets in aircraft and helicopters that carry a ballistic computer.
source: https://wiki.warthunder.com/mechanics/177-ballistic-computer
---

Some modern aircraft and helicopters carry a ballistic computer, which takes most of the guesswork out of hitting ground targets with unguided weapons. It does two jobs:

- **CCIP** (Constantly Computed Impact Point) keeps showing you where your rounds, rockets or bombs would land if you fired right now. You put that marker on the target and shoot.
- **CCRP** (Constantly Computed Release Point) works the other way round. You mark a spot on the ground first, the computer works out where along your flight path the bombs have to leave the aircraft, and it releases them itself when you get there.

## Controls

None of these have a key by default. Bind them, or reach them through the Multi-function menu.

| Control | What it does |
|---|---|
| Toggle Cannon Ballistic Computer | Turns CCIP for guns on or off |
| Toggle Rocket Ballistic Computer | Turns CCIP for rockets on or off |
| Activate target point | Places a CCRP target point wherever your reticle is aimed |
| Deactivate target point | Clears the target point |
| Switch mission bombing target | Puts the target point on a bombing objective (a mini-base or airfield). Press again to move to the next one. |
| Switch sight mode in cockpit | Cycles the cockpit gyro gunsight through its targeting modes, on aircraft that have them |

## CCIP for guns

Switch it on with the toggle. A "CCIP" tag appears beside the ammo count of each weapon it applies to.

- **Aircraft:** aim at the ground within roughly 2.6 km and CCIP takes over. The reticle drops to the spot your rounds will hit and gains a second, angled set of crosshairs to show it is computing.
- **Helicopters:** the gun reticle gains the angled crosshairs. With a turreted gun this changes very little, because a turret reticle already behaves much like CCIP. With fixed guns it works as it does on a plane, but out to a longer range.

## CCIP for rockets

Same toggle approach, same "CCIP" tag.

- **Aircraft:** aim at the ground within about 5.2 km. The rocket reticle turns into an "X" with a dot in the centre and moves to where the rockets will land.
- **Helicopters:** the rocket reticle gains angled crosshairs and shifts to the impact point.

## CCIP for bombs

Aircraft with bomb CCIP always have it on, whether or not the ballistic computer is switched on, and show a "CCIP" tag next to the bomb count. It puts a marker on the ground showing where your bombs will land, much like the Arcade bomb sight.

## CCRP, step by step

Some aircraft can also drop bombs with CCRP. It doesn't need the ballistic computer switched on, but it takes more steps.

1. **Mark the target.** Aim at the spot and press Activate target point, or press Switch mission bombing target to jump to a base or airfield (press again to cycle).
2. **Read the symbols.** A red square appears on the target, a "CCIP/RP" tag appears by your bomb count, and a white vertical line runs through the target point. On that line sits a circle with a horizontal bar somewhere above it. The circle rises and falls as you pitch, and the bar slides down towards the circle as you get closer.
3. **Request release.** Put your reticle on the circle, then press and hold Drop bomb (for one bomb) or Drop bomb series (for several). Nothing falls yet. Angled crosshairs appear around the circle and "Bomb release permission" shows at the bottom of the screen.
4. **Hold steady.** Keep holding the key. Pitch as needed to keep the reticle on the circle, but don't yaw off the white line, and keep your wings as level as you can.
5. **Release.** When the bar reaches the circle, the bombs drop automatically and should land on the mark.

Things to know:

- You can mark the target on one pass and bomb it on the next. The marker disappears while you're pointed away from it and comes back when you turn towards it, and the "CCIP/RP" tag stays the whole time.
- While a target point exists you can't drop bombs by hand. Press Deactivate target point to get normal bombing back.
- At speed, a bomb series can overshoot: only the first bombs land on the mark. Save series drops for dives or for big targets such as airfields or clusters of ground units.

## In the cockpit

To use the ballistic computer from the cockpit, the aircraft needs a gyroscopic gunsight. Switch sight mode in cockpit then cycles through up to four modes, depending on what you are carrying:

- **Standard:** the normal gunsight
- **Cannon on ground target:** CCIP for the primary (or selected) guns
- **Rockets:** CCIP for the next rocket
- **Bombs:** CCIP for the next bomb

Aircraft with a special HUD usually have their own symbols for the CCIP point. See [Aircraft HUD](/guide/mechanics/hud/) for two examples.
