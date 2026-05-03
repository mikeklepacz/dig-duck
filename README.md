# Dig Duck

Dig Duck is a read-only Mac helper for Sneaky Sasquatch. It scans local Apple Arcade save files and shows missing dig spots, with wiki guide matches where the save IDs have been verified.

This is an unofficial community tool and is not affiliated with RAC7, Apple Arcade, Fandom, or the Sneaky Sasquatch Wiki.

## Current Status

- Reads local save files only.
- Does not edit or write save data.
- Supports the three local save slots.
- Includes a save digsite catalog and a community-editable mapping file.
- Shows exact wiki guide matches when known.
- Shows possible guide matches when the exact save ID to wiki number mapping still needs confirmation.

## Requirements

- macOS
- Sneaky Sasquatch installed through Apple Arcade
- Node.js 20 or newer

## Run Locally

```bash
npm install
npm run fetch:wiki
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

The app expects Sneaky Sasquatch saves in the normal Apple Arcade container:

```text
~/Library/Containers/com.rac7.SneakySasquatchMac/Data/Library/Application Support/com.rac7.SneakySasquatchMac
```

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
