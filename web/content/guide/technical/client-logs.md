---
title: Client Logs (.clog)
summary: What War Thunder's .clog client logs record, how to make a small one that pinpoints a bug, and where to find it for a bug report.
source: https://wiki.warthunder.com/306-technical-client-logs-clog
---

A client log is the game's own diary of one play session. It is the file support staff most often ask for in a bug report, because it shows what the client was doing when something went wrong. Client logs have the `.clog` extension.

## What it records

A new client log starts as soon as the launcher starts the game, and it is closed off when you quit. In between it records:

- the actions you took during the session,
- the calculations your client made on its side, and
- anything caught by the game's built-in error catching.

That combination lets the technical team spot problems in the game code or with synchronisation between your client and the server.

## Make the log easy to read

The log is only written out once the session ends, so you need to close the game before you look for it. If your problem can be reproduced, a short log is far more useful than a long one:

1. Start the game fresh.
2. Do whatever triggers the bug.
3. Quit the game yourself.

The resulting log covers little more than the bug, so the error stands out.

## Where to find it

Client logs live in a folder called `.game_logs` inside your War Thunder installation:

- **Installed from the Gaijin website:** go to the install folder you picked during setup.
- **Installed through Steam:** go to Steam's standard install location for the game.

The file names are time-stamped in this pattern:

`YEAR_MONTH_DAY_HOUR_MINUTE_SECOND_ID.clog`

Sort the folder by date and pick the log from the session where the problem happened; usually that's the newest one.

## What to attach

Attach only the plain `.clog` file to your report. You will also see `.clog` files with "cef" in the name; leave those out.

If you are reporting a crash or a performance problem, you may also need the [problem report files](/guide/technical/problem-report-files/) or a [performance profiler](/guide/technical/performance-profiler/) recording, both of which use the same folder.
