---
title: Airborne Radars
summary: How aircraft search and tracking radars work, how to read the PPI, B-scope and C-scope, what the radar modes mean, and how notching works.
source: https://wiki.warthunder.com/mechanics/198-airborne-radars
---

Radars turn up on aircraft at low ranks as well as high ones, and arrived with Update 1.87 "Locked On". If your aircraft has one, a radar display sits on the right of your screen and a compass across the top shows your heading and the direction of anything the radar has found.

There are two kinds:

- **Search (target detection) radars** find aircraft, friendly and hostile, and show them as blips on the display and triangles on the compass.
- **Tracking radars** can lock one target. You then get a box around it on your HUD, its exact distance and your closing speed, and on some aircraft an accurate lead indicator once you're within roughly 500–700 m.

## Controls

| Control | Default key | What it does |
|---|---|---|
| Switch Radar/IRST search on/off | Alt+R | Turns the search radar on or off |
| Change Radar/IRST mode | Unbound | Swaps search and tracking on multi-mode radars, or normal and pulse-Doppler where available |
| Change Radar/IRST search mode | Unbound | Switches scan width, such as narrow or wide |
| Change Radar/IRST scope scale | Unbound | Changes the range shown on the display |
| Select Radar/IRST target to lock | Alt+T | Picks which target a lock will go to |
| Lock Radar/IRST on target | Alt+F | Locks the selected or nearest target, or switches on the tracking radar |

The same group also holds "Switch between Radar and IRST" and "Radar/IRST beyond/within visual range combat". The search mode control sits under the "Weaponry" heading of the aircraft controls. If your lock key shares a combination with anything like flaps, move it, so a fumbled key press can't break your flaps.

## The radar HUD

- A small arrow under the compass at top centre marks your heading, and detected aircraft show on the compass as triangles.
- One or two radar scopes appear on the right.
- If surface clutter is interfering, an icon of two arrows and a row of bars appears next to the power indicator. The more bars lit, the worse it is: one is minor, four is severe. With two radars on, each has its own.
- When the radar is off, an icon replaces the display.

Target symbols:

- **Detected:** a bar on the display and a triangle on the compass.
- **Selected:** a vertical line on each side.
- **Locked:** a box around it.
- **Friendly:** a horizontal line above it, on radars with IFF.

### PPI (the default display)

A fan-shaped, top-down view of the sky ahead, with your radar at the bottom centre. Distance from that point is range, and angle off the centre line is bearing. It can't show altitude.

- A sweep bar swings back and forth while the radar is on.
- Four range rings divide the scale into quarters (scale ÷ 4 = gap between rings).
- Spokes every 15° help you judge bearing.
- The display is always a half circle, even on radars that scan less than 180°.
- The readout on the left gives the radar's azimuth and elevation scan angles. The one on the right gives the range scale.

### C-scope

Some aircraft also get a C-scope under the PPI. It is a forward view: left to right is bearing, up and down is elevation, and it can't show range. Two extra horizontal lines mark the radar's upper and lower scan limits. The degree numbers at its right edge are the limits of the scope, not of the radar. Read the PPI and the C-scope together and you have range, bearing and elevation.

### B-scope

This square display replaces the PPI if you turn on the "Use rectangular radar indicator" setting. Bottom to top is range and left to right is bearing. The scan limits and range scale sit in the top corners, and four bars mark range. The sweep is a vertical bar moving side to side.

## How a radar searches

A radar covers a cone or pyramid in front of the aircraft, set by its azimuth limits (how far left and right), elevation limits (how far up and down), a minimum range (usually 150–300 m) and a maximum range (from 4 km to over 40 km, depending on the set).

Reaching maximum range isn't guaranteed. How far away an aircraft shows up depends on its radar cross-section (RCS), roughly how much radar energy it reflects, so big aircraft are seen sooner. The AI Mk. X on the Sea Venom FAW 20 picks up a G5N1 bomber at its full 14 km, but a small He 162 A-2 only at about 9–9.5 km.

A blip only moves when the radar sees the target again, usually on the next sweep: the old blip goes and a new one appears. If a target isn't seen again for a while, because it left the scan area or the scan was too slow, its blip fades away, and a locked target is lost the same way.

**Range scale.** Bind "Change radar scope scale" to zoom the display in or out. The default scale can be shorter than the radar's real reach, so turn it up to use the radar fully. Some scales go past the radar's maximum range, but nothing beyond that range is ever detected.

**Search width.** Full-width scans take longer, so targets update less often. A narrower mode refreshes faster but covers less, which helps against fast or hard-turning targets. On the PPI, two hard lines mark the new limits. Depending on the radar, the narrower mode trims azimuth or elevation.

### Radar mode labels

| Label | What it means |
|---|---|
| SRC | Basic search. Ground and clouds behind a target can hide it. Fine looking up into clear sky, poor looking down. |
| SRC PD | Pulse-Doppler. It filters out returns closing at your own speed, which removes the ground, but also targets flying across your nose ("notching"). It can have blind spots from its frequencies, so a target you're chasing may refuse to lock. In that case a fast IR missile such as the R-27ET is the answer. |
| SRC PD HDN | Pulse-Doppler for head-on fights. Some radars drop any target that isn't coming towards you. |
| SRC PDV HDN | Targets sorted by speed instead of distance, so the fastest closing target is easy to pick |
| SRC MTI | Moving target indication. It can look down through ground clutter and is harder to notch than PD, but has less range. Even if the radar holds a notching target, the missile's seeker may not. |
| SRC IR | Not radar at all: infrared/optical tracking (IRST) |
| TWS | Track While Scan (see below) |
| TWS HDN | TWS showing only targets heading towards you |

**Ground targets.** Some search and tracking radars can find and lock ground vehicles, which show up like air targets. It's of limited use because of clutter, but it can help find tanks.

**ACM (Air Combat Manoeuvring).** This mode searches a narrow cone at short range and locks the first thing it finds by itself. The F-14A has three ACM modes with different search boxes. Aircraft with a helmet-mounted display add **ACM HMD**: switch to it, use your look-around key to put the square on the target, press select target, and the radar tries to lock.

## Scan patterns

This part is optional, but it explains some radar behaviour.

**Raster scan.** Most search radars sweep side to side, step down, sweep back, and so on. Each pass is one "bar". After the bottom bar, a one-way pattern jumps back to the top, while a two-way pattern retraces its path upwards. On a 4-bar scan, a target may only update once every four sweeps on the PPI.

You can work out vertical coverage from the bars:

- elevation width = number of bars × height of each bar
- top limit = (elevation width ÷ 2) + vertical offset
- bottom limit = −(elevation width ÷ 2) + vertical offset

The vertical offset is how far the pattern is shifted up or down. The AN/APS-21 has 15 bars of 2° each (30° in total) and an offset of +5°, so it sees from 20° above you to 10° below.

**Conical scan.** Tracking radars spin their beam in a small circle slightly off-centre, covering a narrow cone. That spin is how they tell where in the cone the target sits, and so how they track it.

**Continuous radars.** The German Lichtenstein family on WWII German aircraft doesn't scan at all. It floods a cone with energy constantly, so blips update all the time and the whole coverage area lights up on the display. The price is a short range (only 4 or 5 km) and a narrow cone.

## Search and tracking radars

Search radars appear from rank 1 and get much better at higher ranks. Tracking radars belong to high-rank aircraft and usually work alongside a search radar. They have a shorter range and their own coverage, which shows as a darker area on the display.

### Locking a target

There are two ways:

1. **From the display.** When the search radar finds targets inside the tracking zone, one of them is selected. Change the choice with the select key, then press lock: the tracking radar comes on and tries to lock it.
2. **Boresight.** Press the lock key (or the mode key, depending on the radar) to switch the tracking radar on directly. It starts a conical scan straight ahead and a flashing green square appears on screen. Put the square on an aircraft within the range limits shown beside the square, and the radar tries to lock. Clutter can stop it.

Once locked, the target is boxed on your HUD, display and compass, with its exact distance and closing speed (negative when it's pulling away). If your aircraft supports it, a lead indicator appears within 500–700 m.

To keep the lock, keep the target inside the tracking radar's range and coverage. If it's out for more than a moment, the lock breaks. The tracking zone is often wider than your view from the cockpit, so you don't have to point straight at the target (this is the idea behind the "crank" manoeuvre). Aircraft passing close to your target can break the lock or steal it, and can throw the lead indicator off for a moment.

### Multi-mode radars

Radars like the AN/APQ-100 on the F-4 Phantom II use one antenna for search and tracking, but not both at once. Toggle between them with the mode key, and expect to lose your search picture while tracking. The RP-5 isn't one of these: it searches and tracks with two separate antennas.

### Track While Scan (TWS)

Radars such as the AN/AWG-9 (F-14A Early) and PS-46/A (JA37C) can track targets while still searching. Tracking in TWS uses lower intensity, so it doesn't spike the enemy's radar warning receiver. It can follow several targets at once, which pairs well with active radar homing and radar-slaved missiles. Semi-active radar homing missiles still need a hard lock.

### Radar gunsights

Some aircraft have a small ranging radar that feeds the target's range into the gyro gunsight automatically, instead of the pilot setting it by hand. Aircraft without a full radar show a radar gunsight indicator instead. In the cockpit the gyro sight corrects itself. Modern aircraft also get a third-person radar gunsight on a locked target at close range. On the F-16 ADF you put the large circle over the locked target inside 500 m. Turn it on and off with the lock key. Many only work between about 200 and 500 m.

## What the radar stats mean

**Search radar**

- **Maximum detection range:** the furthest it could ever see. In practice most targets appear much closer, depending on their RCS and on clutter.
- **Base detection range:** how far it will see any target, however small, before clutter is counted. With no clutter (and Arcade doesn't model clutter), that's effectively a guaranteed detection range. Larger aircraft can be seen further out.
- **Minimum detection range:** anything closer is invisible to it.
- **Azimuth scan limits:** how far each side it looks. ±75° means 75° left and 75° right.
- **Elevation scan limits:** total coverage up and down, often covered in several bars.
- **Period:** how long one complete scan of the whole area takes.

**Tracking radar**

- **Maximum tracking range:** the furthest it can hold a track.
- **Minimum tracking range:** you can't start a track inside it, and a target that comes closer is dropped.
- **Azimuth and elevation tracking limits:** how far to the sides, and up and down, it can track.

### Clutter and side lobes

Arcade has no clutter. In Realistic and Simulator, echoes from the ground or sea show as a green haze on the PPI, getting thicker as the clutter worsens. Anything beyond mild clutter usually hides real targets in that area and can stop a tracking radar from tracking. Because the echoes come from the surface, clutter gets worse when the radar looks down, which can hide aircraft below you. Newer radars usually cope better than older ones.

A radar also leaks weaker energy off to the sides, called side lobes. Near the ground these confuse it too, and they are why your RWR goes off when you fly close to a friendly aircraft.

## Tips

- A damaged radar won't switch on until it has been repaired.
- The display is drawn relative to your aircraft, so rolling moves targets around on it.
- If targets update too slowly, narrow the search area.

### Notching a pulse-Doppler radar

A pulse-Doppler radar needs a target whose speed towards or away from it differs clearly from the background. An aircraft flying at right angles to the radar has almost none, so the radar can't lock it or hold it. That is notching, the standard counter to PD radar. Turn so the threat sits at your 3 or 9 o'clock, which puts you at 90° to its radar beam. Against a radar that isn't in PD mode, notching does very little, so dive and hide in the ground clutter instead.
