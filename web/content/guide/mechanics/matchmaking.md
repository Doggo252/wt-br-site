---
title: Matchmaking
summary: How battle rating decides who you fight, and the different matchmaking rules each game mode uses to rate your lineup.
source: https://wiki.warthunder.com/mechanics/matchmaking
---

Who you meet in a match comes down to one number: battle rating. Your research rank, win rate and kill count play no part at all. What does change from mode to mode is how the game turns the vehicles in your lineup into the single rating it matches on, and that is what this page walks through.

## Battle rating basics

- Every aircraft, ground vehicle and ship has a battle rating (BR) that reflects how strong it is **in the game**, not when it entered service. A late-war design can sit below an older one if it performs worse.
- BRs run from 1.0 to 14.0 and go up in steps of 0.3 or 0.4. Strictly, each step is a third of a point rounded to one decimal place, which gives 1.0, 1.3, 1.7, 2.0 and so on.
- Reserve vehicles are all 1.0.
- One vehicle can have a different BR in Arcade, Realistic and Simulator. An aircraft can also have one BR in air battles and another when it is flown in ground or naval battles.
- The BR is printed at the top of the vehicle's stat card and in the bottom-right corner of its icon in the research tree. To see another mode's value, change the mode in the drop-down at the bottom right of the Research screen.
- The BR that will actually be used for your next battle is shown under the "To Battle!" button.

You can browse BRs by mode in our [ground](/ground/), [air](/air/) and [helicopter](/helicopters/) trees, and see recent changes on [BR updates](/updates/).

## Which method each mode uses

| Mode | Air | Ground | Naval |
|---|---|---|---|
| Arcade | Average BR of the lineup | Highest BR in the lineup | Highest BR in the lineup (with an aircraft rule) |
| Realistic | BR of the chosen aircraft | Highest BR in the lineup | Highest BR in the lineup (with an aircraft rule) |
| Simulator | Fixed BR brackets | Rotating vehicle list | None |

## Highest BR

Used in Air RB, Ground AB and RB, and Naval AB and RB.

The game takes the highest BR in your lineup. Air RB has no multi-vehicle lineup, so there it is simply the BR of the plane you picked. The battle is then built around these rules:

- Every lineup in the match has a top BR within 1.0 of every other lineup, so you can meet opponents up to 1.0 above or below you.
- Each team can have at most 4 players sitting at the very top of the battle's BR range.

Take a 5.3 lineup. At worst it lands in a 5.3–6.3 battle, at the bottom of the range and facing vehicles a full 1.0 higher: the familiar "full uptier". At best it lands in a 4.3–5.3 battle as one of the top vehicles: a "full downtier". Anything in between can happen too.

Two extra rules:

- **Air RB:** no team can have more than 4 bombers.
- **Naval:** an aircraft in your lineup may be at most one BR step (0.3 or 0.4) above your highest ship. A plane above that limit is ignored when your lineup BR is worked out, and you can't spawn it in that battle.

To see which vehicles you would meet at a given BR, try the [lineup finder](/lineup/).

## Average BR (Air Arcade)

Air AB blends the BRs of the three highest-rated aircraft in your crew slots. The point is to let a newly unlocked, stock plane fight in slightly gentler matches while you upgrade it, as long as the rest of your lineup sits a little lower.

Call the three highest BRs A, B and C, from highest to lowest.

| Usable aircraft | Formula |
|---|---|
| Three or more | BR = A/2 + B/4 + C/4 |
| Two | BR = A/2 + B/2 |
| One | That aircraft's BR |

After that:

- The result is rounded **up** to the nearest real BR step (.0, .3 or .7).
- If B or C is more than 0.6 below A, it counts as A − 0.6 in the sum. Very low planes can't drag the average far down.
- The average can never fall more than one step below your top aircraft. With a 5.0 at the top, the lowest you can get is 4.7.

For example, a 5.0 flown with two 4.3s gives 2.5 + 1.075 + 1.075 = 4.65, which rounds up to 4.7.

## Fixed BR brackets (Enduring Confrontation)

Used in Air SB and Naval Enduring Confrontation.

Here the game doesn't build a range around you. Lobbies belong to fixed BR brackets instead. In Air SB the set of brackets changes every two days, cycling through four sets:

| Set | Brackets |
|---|---|
| 1 | 1.0–2.0, 2.3–3.7, 4.0–5.0, 5.3–6.3, 6.7–7.7, 8.0–9.0, 9.3–10.3, 10.7–11.7, 12.0–13.0, 13.3–14.3 |
| 2 | 1.0–2.0, 2.3–3.3, 3.7–4.7, 5.0–6.0, 6.3–7.3, 7.7–8.7, 9.0–10.0, 10.3–11.3, 11.7–12.7, 13.0–13.7, 14.0–14.3 |
| 3 | 1.0–1.7, 2.0–3.0, 3.3–4.3, 4.7–5.7, 6.0–7.0, 7.3–8.3, 8.7–9.7, 10.0–11.0, 11.3–12.3, 12.7–13.3, 13.7–14.3 |
| 4 | 1.0–1.7, 2.0–2.7, 3.0–4.0, 4.3–5.3, 5.7–6.7, 7.0–8.0, 8.3–9.3, 9.7–10.7, 11.0–12.0, 12.3–13.0, 13.3–14.3 |

Both teams in a lobby get the same two ranges:

- **Required vehicles:** at least one vehicle in your lineup must fall in this range, or you can't join.
- **Allowed vehicles:** the rest of your lineup must fall in this range to be usable.

You are matched with players whose lineups fit the same ranges.

## Vehicle lists (Ground Simulator)

Ground SB doesn't match on BR at all. Every two days a new list of specific vehicles comes into rotation, and the lists aren't put together by BR. Sometimes there is a main list for ground vehicles while aircraft are allowed by a BR range.

## Assault

Air Assault and Ground Assault have fixed levels. Which level you get depends on the highest BR you bring: your top aircraft in Air Assault, your top tank or helicopter in Ground Assault. Vehicles below a level's range are always allowed in it.

| Level | Air Assault | Ground Assault |
|---|---|---|
| 1 | 1.0–2.3 | 1.0–2.3 |
| 2 | 2.7–3.7 | 2.7–3.7 |
| 3 | 4.0–5.0 | 4.0–5.0 |
| 4 | 5.3–6.3 | 5.3–6.3 |
| 5 | 6.7–12.7 | 6.7–8.0 |
| 6 | None | 8.3 and up |
