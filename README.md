# Dig Duck

Dig Duck is a read-only Mac helper for Sneaky Sasquatch. It scans your local Apple Arcade save files and shows which dig spots are still missing in each save slot.

This is an unofficial community tool and is not affiliated with RAC7, Apple Arcade, Fandom, or the Sneaky Sasquatch Wiki.

## Quick Start

No Terminal or install is needed for the GitHub download.

1. Download `Dig-Duck-1.0.1.zip` from the [latest release](https://github.com/mikeklepacz/dig-duck/releases/tag/v1.0.1).
2. Unzip it.
3. Double-click `Open Dig Duck.html`.
4. Click **Choose Save Folder**.
5. Choose the Sneaky Sasquatch save folder.

Dig Duck runs in your browser and reads the selected files on your Mac. It does not upload your saves.

## Manual Run

Developers can run the source project locally:

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
- A browser that supports folder selection

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
