---
title: Manual Engine Controls
summary: What each manual engine control does (radiators, prop pitch, mixture, superchargers, boosters), sensible settings, and the defaults when you switch to MEC.
source: https://wiki.warthunder.com/mechanics/245-guide-to-manual-engine-controls-mec
---

Manual Engine Controls (MEC) let you take over the engine settings the game normally manages for you. Get them right and the engine runs cooler, burns less fuel and gives you more speed, and you can coax a damaged engine back to base. They take some practice, but they are a real edge in a propeller fighter.

## Turning MEC on

You need a key to switch the engine to manual mode. It lives in the Full-Real Controls settings under the Aircraft category. Once it is bound, you can use MEC with any control scheme by pressing that key.

When you switch to manual, each control starts from a fixed value. When you switch back to automatic, your last manual settings are remembered and restored the next time you go manual.

| Control | Starting value in manual mode |
|---|---|
| Water and oil radiators | 50% |
| Propeller pitch | 50% |
| Mixture | 60% |
| Turbocharger | 0%, rising slowly to 50% |
| Supercharger | Stage 1 |

## Ignition and engine selection

**Ignition** (default **I**) starts and stops the engine on every aircraft, whether or not you use MEC. Ignition and throttle are independent. Pushing the throttle to 100% does nothing if the engine is off, and an engine running at idle keeps the propeller turning slowly while producing almost no power.

Shutting an engine down in flight has its uses. If the engine is on fire, switching it off stops fuel being pumped into the blaze and may put it out. A stopped engine also cools very quickly, but only do that when you are sure no enemy is nearby.

**Engine selection** picks one engine, or all of them, for the other MEC controls to act on. On single-engine planes you'll rarely need it. On multi-engine aircraft such as the B-17 or Mosquito it lets you manage a damaged or dead engine separately, which can be what gets you home. Remember to select all engines again afterwards.

## Radiators

The radiator control actually moves the cowl flaps that let cooling air through. 0% means fully closed and 100% fully open.

- **Open flaps cool the engine but add drag**, which hurts dive speed, energy retention and top speed.
- **In a long climb**, power-to-weight matters most and the extra drag costs little, so opening up is cheap.
- **When you need every bit of speed**, closing the flaps is reasonable.
- **On the opening climb**, with no fight yet, 100% is a safe choice. Some planes stay cool enough with the flaps only part-open, which costs less drag.

The engine temperature readout on the HUD goes from yellow to orange, then red, then flashing red, and after that the engine starts taking damage. Aim to stay in yellow or orange, and only run hotter in an emergency where slowing down would lose you the fight. Cooling works better at higher speed and altitude, high throttle makes more heat, and cold maps need less radiator than hot ones. Every plane behaves a little differently, so expect to learn each one.

With a damaged cooling system, fly gently. Left alone for long, it will slowly wreck the engine, so head back for repairs as soon as you can.

Who gets which controls:

- **Most planes:** full manual control of both the oil radiator and the water (engine) radiator.
- **Most biplanes:** no radiator control at all; temperature is managed with throttle and, where available, prop pitch.
- **Spitfire Mk I and Mk Vb:** control of the water radiator only; the oil is cooled passively or automatically.
- **Bf 109 F series onwards and some late-war planes:** radiators stay automatic under MEC, but a separate toggle hands them over to you.
- **Jets:** no radiator controls.

## Propeller pitch

Pitch is the angle of the propeller blades, set with the prop control.

- **Low pitch** (shallow blade angle): the propeller turns easily and reaches high RPM. Good for thrust at low airspeed.
- **High pitch** (steep blade angle): low RPM, but the propeller works better at high airspeed. At high speed, low pitch adds drag and can over-rev the engine until it fails.

The easy mistake is mixing up the two scales: low pitch means high RPM, and high pitch means low RPM. In the game, **100% is low pitch, high RPM** (prop lever fully forward), and **0% is high pitch, low RPM**, or feathered where the plane has it. For the variable-pitch propellers most planes carry, the rule is high RPM at low speed and lower RPM at high speed.

Practical points:

- Bind pitch to a relative control. Flicking between 0% and 100% wastes performance and can over-rev the engine.
- On planes without feathering, which includes most fighters, set 0% if the engine dies; it helps you glide. 0% also saves fuel and reduces overheating.
- On most planes with manual pitch, 90-100% gives full performance at combat speeds and 70-80% suits economical cruising and lower-drag dives. Some planes want different numbers.

Not every plane lets you touch the pitch. Most biplanes and interwar aircraft have fixed-pitch propellers, and jets have none. Many German, Italian and late-war planes have an automatic constant-speed governor that you can switch to manual, but don't do that unless you know the plane, especially the German ones. Manual mode turns the governor off, and the propeller can over-rev. For example, a Bf 109 from the F series onwards will over-rev in manual mode above roughly 60-65% pitch at full throttle, yet never over-revs on automatic. Not every governed plane suffers from this.

Used carefully, a pitch setting that would normally over-rev can act as an airbrake when you pull the throttle back, sometimes better than real airbrakes. It takes experience to avoid wrecking the engine.

## Feathering

The "Prop Feathering" control is under Controls, then Full Aircraft Controls, then Manual Engine Controls. It turns the blades edge-on to the airflow, which cuts the drag of a dead engine's propeller a great deal. On multi-engine aircraft, when a fighter knocks out one engine, select that engine and feather it to stay in the air more easily.

## Mixture

A piston engine burns fuel mixed with air, and it runs best at the right ratio. More fuel is "rich", more air is "lean". Many planes set the mixture automatically, but the automatic setting isn't perfect and may not match what you want, so it is worth learning.

The game shows mixture as a percentage. Air thins as you climb, so the higher you go, the leaner you should run:

| Situation | Mixture |
|---|---|
| Low altitude, full performance | Close to 100% |
| High altitude, for example 8,500 m | Around 40% |
| Default with MEC on | 60% |
| 0% | Starves the engine and stops it |
| Some planes only: up to 120% | Below 1,000 m, for hard takeoffs and landings, or as a kind of WEP |

Most planes fly fine left at 60%. A few, such as the Ki-44-I and P-47, need active mixture management to get full thrust. Most German and Italian fighters set mixture automatically and won't let you change it. Jet turbines are automatic too, and liquid-fuel rocket engines run at a fixed fuel-to-oxidiser ratio.

## Turbochargers and superchargers

Both exist to push more air into the engine as the air thins with altitude.

**Turbochargers** are driven by exhaust gas. They appear almost only on USAAF high-altitude aircraft such as the P-38, P-47 and B-29. The extra weight and complexity pay off high up: above 18-20k feet they beat mechanical superchargers. The game regulates them automatically, and manual control is possible but not advised: it can damage the turbocharger and cost you high-altitude performance.

**Mechanical superchargers** usually have one to three stages, each one working best in its own band of altitude, so you shift between them as you climb. The altitude to change stage differs from plane to plane. Either look it up in a period manual for the aircraft, or watch the manifold pressure gauge in the cockpit and pick the stage that gives the highest pressure where you are. Shift back down as you descend. Some planes change stages automatically and give you no say.

## Rocket boosters and RATO

The "Ignite Booster" control has no default key, so bind one. You need it to get the most out of the Me 262 C-1a and C-2b "Heimatschützer" jets, whose liquid-fuel rockets add a huge amount of thrust for climbing and accelerating. Press the same key again to shut them off and save fuel. The same control fires RATO (rocket-assisted takeoff) boosters on planes that carry them.

## Examples

| Aircraft | Prop pitch | Radiators |
|---|---|---|
| Bf 109 A to E-3 | Manual; needs constant attention to avoid over-revving | Fully manual; anywhere from 50-100% keeps temperatures down |
| Bf 109 E-4 | Automatic; switching to manual is not advised | Fully manual; 80-100% while climbing |
| Bf 109 F series onwards | Automatic; switching to manual is not advised | Automatic; better to switch to manual and set 100% while climbing |
| Spitfire Mk I/II | Manual; oil temperature depends on it. Hold 2550-2600 rpm at 100% throttle to avoid overheating | Manual water radiator: 100% for the first minute of a climb or while using WEP; 0-10% when cooling the oil at normal throttle |
