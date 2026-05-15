# Dig Duck

Dig Duck is a read-only Mac helper for Sneaky Sasquatch. It scans your local Apple Arcade save files and shows which dig spots are still missing in each save slot.

This is an unofficial community tool and is not affiliated with RAC7, Apple Arcade, Fandom, or the Sneaky Sasquatch Wiki.

## Quick Start

Dig Duck is not packaged as a double-click Mac app yet. For now, you run it locally from this project folder.

1. Install [Node.js 20 or newer](https://nodejs.org/).
2. Download this project from GitHub:
   - Click the green **Code** button.
   - Click **Download ZIP**.
   - Unzip the file.
3. Open **Terminal**.
4. Type `cd `, drag the unzipped `dig-duck` folder into Terminal, then press **Return**.
5. Run these commands:

```bash
npm install
npm run fetch:wiki
npm run dev
```

6. Open the local web address printed by Terminal. It is usually:

```text
http://127.0.0.1:5173/
```

If port `5173` is already in use, Terminal will print a different local address such as `http://127.0.0.1:5174/`. Use the address Terminal prints.

Leave Terminal open while using Dig Duck. Press `Control-C` in Terminal when you are done.

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
