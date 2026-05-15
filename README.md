# Dig Duck

Dig Duck is a read-only Mac helper for Sneaky Sasquatch. It scans your local Apple Arcade save files and shows which dig spots are still missing in each save slot.

This is an unofficial community tool and is not affiliated with RAC7, Apple Arcade, Fandom, or the Sneaky Sasquatch Wiki.

## Quick Start

Dig Duck is not packaged as a full Mac app yet, but the release zip includes a double-click launcher.

1. Install [Node.js 20 or newer](https://nodejs.org/).
2. Download `Dig-Duck-1.0.1.zip` from the [latest release](https://github.com/mikeklepacz/dig-duck/releases/tag/v1.0.1).
3. Unzip it.
4. Double-click `Run Dig Duck.command`.

The launcher installs the needed packages the first time, downloads the wiki guide images, starts Dig Duck, and opens it in your browser.

Leave the launcher Terminal window open while using Dig Duck. Press `Control-C` in that window when you are done.

## If macOS Blocks the Launcher

Because this is a free unsigned download, macOS may show:

```text
Apple could not verify "Run Dig Duck.command" is free of malware.
```

If that happens:

1. Click **Done**.
2. Open **Terminal**.
3. Type this command, including the space at the end:

```bash
xattr -dr com.apple.quarantine 
```

4. Drag the unzipped `dig-duck` folder into Terminal.
5. Press **Return**.
6. Double-click `Run Dig Duck.command` again.

## Manual Run

If the launcher does not work, open **Terminal**, type `cd `, drag the unzipped `dig-duck` folder into Terminal, press **Return**, then run:

```bash
npm install
npm run fetch:wiki
npm run dev
```

Open the local web address printed by Terminal. It is usually:

```text
http://127.0.0.1:5175/
```

If port `5175` is already in use, Terminal will print a different local address. Use the address Terminal prints.

## Requirements

- macOS
- Sneaky Sasquatch installed through Apple Arcade
- Node.js 20 or newer

## What It Does

- Reads local save files only.
- Does not edit or write save data.
- Supports the three local save slots.
- Shows missing dig spots for each save.
- Counts missing digsites against a full-game baseline when a completed save is available.
- Shows exact wiki guide matches when known.
- Shows possible guide matches when the exact save ID to wiki number mapping still needs confirmation.

The app expects Sneaky Sasquatch saves in the normal Apple Arcade container:

```text
~/Library/Containers/com.rac7.SneakySasquatchMac/Data/Library/Application Support/com.rac7.SneakySasquatchMac
```

## Latest Update

Version `1.0.1` fixes missing digsite counts for incomplete saves and makes the local development ports more reliable.

## Wiki Guide Data

The app can fetch dig spot descriptions and images from the Sneaky Sasquatch Wiki page:

```text
https://sneaky-sasquatch.fandom.com/wiki/Dig_Spot
```

Downloaded wiki images are intentionally not committed to this repository. Run `npm run fetch:wiki` to rebuild the local image cache.

## Helping With Mappings

The important community work is confirming exact matches between save-file digsite IDs and wiki dig numbers.

Useful report format:

```text
Save slot:
Scene:
Digsite ID:
Position:
Wiki dig number:
How you confirmed it:
```

Exact mappings live in:

```text
src/data/wiki-mapping.json
```

## Safety

Dig Duck is designed as a read-only diagnostic tool. It scans `.stuff` files but does not modify them.
