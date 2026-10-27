---
title: DEV Server
summary: What the DEV test server is, how to install it on PC, Linux or macOS, and what does and does not carry over to your real account.
source: https://wiki.warthunder.com/mechanics/dev_server
---

The DEV server is a separate test version of War Thunder where major updates, new mechanics and new content are tried out before they reach everyone on the main server. It is only open at certain times, so watch the official announcements (our [news page](/news/) collects the posts from warthunder.com). Technical problems can also close it without warning, so don't count on it staying up.

## Installing it

### With the DEV launcher (PC)

1. Download the [DEV server launcher](https://launcher.warthunder.com/wt_dev_launcher.exe).
2. Install it in its own folder, separate from your normal War Thunder install.
3. Run it, and it will download the files for the DEV version.

### By hand (also works on Linux and macOS)

1. Make a copy of your game folder.
2. Inside the copy, create an empty file named `matchingdevmode`.
3. Open `config.blk` in the copy and add this section:

```
yunetwork{
curCircuit:t="dev"
isExpertMode:b=yes
}
```

4. Run the launcher from the copied folder to download the DEV version's files.

## How your account works there

When the DEV server opens, you play on a snapshot of your account made shortly beforehand. It is a pure test environment, and nothing you do there comes back to the live game:

- Progress and unlocks stay on the DEV server.
- Golden Eagles, Silver Lions and Research Points you spend there are not taken from your real account.

There is one important exception: **anything you buy from the store through the test server, Golden Eagles included, is credited to your main account.**

The DEV server also runs with some special settings:

| Setting | On the DEV server |
|---|---|
| Research Points and Silver Lions earned | x5 |
| Vehicle prices | Half price |
| Converting experience with Golden Eagles | Half price (and no real Golden Eagles are spent) |

## Reporting problems

What you play on the DEV server is pre-release content. It can still change after testing, and it may contain bugs and inaccuracies. If you find one, report it through the [Bug Report Service](https://community.gaijin.net/issues/p/warthunder).
