---
title: Game Cache
summary: What War Thunder keeps in its cache folder and how to clear it so the game rebuilds a clean copy when you're troubleshooting.
source: https://wiki.warthunder.com/312-technical-game-cache
---

While War Thunder runs, it downloads bits of data and keeps them in a local cache so it doesn't have to fetch them again. That cache holds things such as decals, skins and configuration files. If any of it gets corrupted or goes stale, it can cause problems that look like bugs in the game itself.

That's why clearing the cache is a sensible first step whenever you're chasing a technical problem: it makes sure you're testing from a clean state.

## Clearing the cache

The cache can't be repaired in place; you delete it and let the game build a new one.

1. Open the folder where you installed War Thunder and find the folder called `cache`.
2. Delete the whole `cache` folder.
3. Start the game again. It will download the cache files it needs from scratch.

If the problem continues with a fresh cache, it's also worth running a [game integrity check](/guide/technical/game-integrity/) before you report it.
