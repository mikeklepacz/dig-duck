# Dig Duck

Dig Duck is a read-only Mac helper for Sneaky Sasquatch. It scans your local Apple Arcade save files and shows which dig spots are still missing in each save slot.

This is an unofficial community tool and is not affiliated with RAC7, Apple Arcade, Fandom, or the Sneaky Sasquatch Wiki.

## Mac App Store version — in preparation

Version 1.1.0 now runs in its own sandboxed Mac window. Players choose their save folder once, then reopen or rescan without Terminal, Homebrew, Node, or a local browser server. A clearly labelled example preview is included.

The native app is implemented locally; it has **not** been submitted to or approved by the Mac App Store. The existing public 1.0.2 download still uses the older browser launcher.

For native builds and App Store submission, see [macos/README.md](macos/README.md). Prepared listing and privacy copy are in [docs/app-store](docs/app-store).

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

Version `1.1.0` replaces the browser launcher in the source project with a native Mac window, read-only folder permission, remembered access, rescan, and recovery messages. App Store publication is pending.

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
