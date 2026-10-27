---
title: SPAA Radars and Sensors
summary: How anti-aircraft vehicles find and lock aircraft with radar, IRST and optronic trackers, how to read the display, and what throws a lock off.
source: https://wiki.warthunder.com/mechanics/193-spaa-radars-and-sensors
---

Many anti-aircraft vehicles (SPAA) carry sensors for finding and tracking aircraft. A search sensor puts every aircraft it detects onto a radar display on your HUD. A tracking sensor lets you lock one of them, which gives you its exact range and relative speed, and, once it is close enough, an accurate lead indicator. This replaced the old arcade-style lead marker that radar SPAA used to get in Realistic and Simulator, and arrived with Update 1.87 "Locked On". Update 1.89 "Imperial Navy" then added tracking errors, so lead indicators became less accurate at long range and aircraft flying lower than 100 m above the terrain became harder to track.

Radar has a cost, too. Aircraft with a radar warning receiver (RWR) can pick up your emissions and find out where you are.

## Controls

The defaults are awkward, so most players rebind them.

| Control | Default key | What it does |
|---|---|---|
| Switch radar search on / off | Alt + R | Turns the search radar (or other search sensor) on or off |
| Change radar search mode | Unbound | Switches between scan modes, such as sector or 360° |
| Change radar scope scale | Unbound | Changes the range shown on the display |
| Select radar target to lock on | Alt + T | Picks which target on the display a lock will go to |
| Lock radar target on | Alt + F | Locks the selected or nearest target on the display. In gunner view it makes the tracker sweep and try to lock whatever is under the crosshairs, or the first aircraft it finds. |
| Switch radar indicator type | Unbound | Switches between the PPI and B-Scope displays |

There is also a "Change radar mode" control, unbound by default, with no documented use on SPAA.

## Reading the display

Every SPAA with sensors gets a radar display and a compass on its HUD.

### PPI (the default)

A round, top-down map of the sky around you, with north always at the top.

- You're in the middle, and a line shows which way your turret faces.
- When search is on (a lightning-bolt symbol shows above the display), a sweep line rotates to show where the sensor is looking.
- Faint spokes every 30°, together with the bearing marks on the display and compass, help you judge direction.
- Four evenly spaced rings, counting the outer edge, give distance. Divide the range setting by four to get the gap between rings, so on a 4 km setting each ring is 1 km further out.
- If you have a tracking system, a darker zone shows where a target can be locked. It usually turns with the turret.

### B-Scope

A rectangle with you at the bottom. Left to right is bearing and bottom to top is distance. North is fixed in the middle, with −180° at the left edge and +180° at the right. A vertical line shows your turret direction, a thicker one shows the sweep, four lines mark range, and the lockable area is a darker box.

### Target symbols

- **Detected target:** a plain blip. Fast movers are drawn as a short line instead of a dot.
- **Friendly (IFF only):** a line under the blip. Without IFF, friend and foe look identical.
- **Selected:** a vertical bar on each side. Only targets inside the lockable zone can be selected, and the Select key cycles between them.
- **Locked:** a solid square.

### Compass and the lock box

The compass across the top of the screen shows your turret heading in degrees, with 0° as north. Detected aircraft appear on it as triangles, and the locked one has a box around it.

When you lock an aircraft, a box appears around it in your view with its distance and relative speed beside it. Once it is in range, an accurate firing indicator appears. The turret now follows the target by itself and sets the time fuses on self-destructing shells. The firing indicator stays very accurate as long as the aircraft keeps a steady speed and heading. If the lock is lost, the square drifts and blinks for a few seconds, then disappears.

## Kinds of sensor

Sensors are either **active** (radar, which sends out radio waves and listens for the echo) or **passive** (infrared and optronic systems, which emit nothing). They also have one of two jobs:

- **Search** sensors scan around you and put whatever they find on the display and compass.
- **Tracking** sensors don't look for targets. They lock onto one target and supply its data and a lead indicator.

Most SPAA have both. Some only have a tracker, so you have to put your crosshairs on an aircraft you can see and lock it by hand. Mixed setups exist too: the ADATS pairs a search radar with an infrared tracker.

### Active radar

This is by far the most common type. Its weaknesses:

- RWR-equipped aircraft can detect it.
- **Ground clutter:** false echoes from the ground hide real targets.
- **Multipath:** against low-flying aircraft the lock box sits below the target instead of on it.
- A target is only seen when the beam points at it, so its blip only updates once per sweep.
- Small aircraft are harder to detect.
- Hills block the radar completely. Trees are half-transparent to it, and each tree in the way shortens its range.
- It can't see or track a target whose **relative** speed is too low. That means speed towards or away from the radar, not airspeed, so an aircraft circling you at about the rate the radar turns can drop out of sight.
- There is a minimum range, inside which nothing is detected or tracked.
- The search radar and the tracking radar are separate sets with different limits. If a target sits in the lockable zone but can't be selected, the search radar sees it and the tracker doesn't.
- Aircraft close together, friendlies included, confuse the tracker. The lock may drop or jump to another plane, so in a crowded sky switch to gunner view and aim yourself to avoid shooting down a teammate.

Once you lock, the guns swing onto the target by themselves. Some radars can keep tracking a target after it leaves the darker lock zone. Even with search off, or when search hasn't picked a target up, you can usually aim at an aircraft by hand and press Lock. When firing on a good lock, use controlled bursts rather than one long stream so you have ammunition left when the pilot dodges.

**Combined search and track radars.** Some vehicles use one radar for both jobs, and nearly all of these lack Track While Scan. Locking a target blanks the search picture until you let go. Vehicles with separate radars keep searching while they track.

**Radar rangefinders.** These work like a tracking radar but have no search radar at all. Go to gunner view, put the crosshairs on the aircraft and press Lock. The range they measure sets your shells' fuses so they burst near the target, and it drives a lead indicator.

**Scan modes.** Besides a full 360° sweep, some search radars offer:

- **Sector:** the radar sweeps back and forth across an arc ahead of the turret, and the arc moves when the turret turns.
- **Line of sight:** the dish stops spinning and points straight along the turret, covering only a thin slice. You have to point at the aircraft to see it, so nudge the turret around a little. Small, low-flying aircraft can slip past even then.

### Infrared and optronic systems

Passive systems were developed so that air defences could work without being found by anti-radar missiles. An **optronic** tracker is a powerful camera: the gunner picks a target and locks it, and a computer follows it in the video feed and provides lead. **Infrared** systems detect and track the heat an aircraft gives off. Both have a short range compared with radar, but they don't set off anti-radar warnings.

Using an IRST system:

- The display looks like a radar display, but "IRST" replaces the power symbol.
- An infrared search set can't measure range, so every contact sits on the edge of the display and only its bearing tells you anything. In exchange, it can tell whether a target is hostile.
- Trees block optical sights and trackers completely, unlike radar. That includes the ADATS tracker and the Stormer SPAA. Avoid setting up beside a forest.
- These systems are usually paired with missiles to make up for their short range. They track a little less precisely and dependably than radar does, lean heavily on optical tracking from the gunner's seat, and reward a high Targeting crew skill and a steady hand, since you guide sensitive missiles all the way in.
- In full IRST mode the gunner crosshair mimics the missile's lag as it follows the aircraft. Keep the crosshair on the plane to steer the missile, but keeping the missile itself on target matters more.
- An aircraft crossing fast at a sharp angle can outrun the turret's automatic tracking.
- Maximum zoom isn't the best zoom for missile guidance. The Stormer HVM has 10–40x optics, and simply zooming all the way in will probably cause a miss. Instead, stay in the gunner sight, use the radar display to find your next target, turn the turret towards it, lock, and let the tracker work.

## Tracking errors

The firing solution itself is always calculated correctly. Since Update 1.89, though, the sensor can be wrong about where the aircraft actually is.

### Unstable lock

Clutter between you and the aircraft, or a sensor working near the edge of its abilities, makes the lock box shake, and the worse either gets, the more it shakes. It can wander off and even come away from the aircraft altogether. The lead reticle then points the wrong way, and proximity fuse timing gets worse. It is most dangerous in the gunner sight, where it's hard to watch the aircraft and the reticle at once.

**Fix it:** look at how far, and in which direction, the lock box sits from the real aircraft, and shift your aim by the same amount the opposite way. To avoid it altogether, work from high, open ground at ranges and angles your tracker handles comfortably. That also makes you easier to hit, so learning to correct for the error is usually the better choice.

### Multipath (ground echo)

Against an aircraft flying very low (around 100 m above the ground), echoes off the ground pull the lock box down into the terrain. Trust the radar for bearing and range, but set the height yourself to match the aircraft, and don't let the turret follow the reticle into the ground. With a missile SPAA you can also fire the missile straight at the aircraft and hope it intercepts in time.

## The downside of switching on

- Helicopters and aircraft with radar warning get an alert, with a rough direction, as soon as your radar touches them. Better warning sets tell them more, and most sound an alarm when a radar starts tracking them. If your tracker is a radar, they know you're about to fire.
- Some will answer by rocketing your position. Switch the search radar off when you don't need it. You can usually still lock targets, but a radar tracker can set off their warnings by itself.
- Some SPAA fold their radar down when it's off, which makes them a smaller target for enemy tanks.
