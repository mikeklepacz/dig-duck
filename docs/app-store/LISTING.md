# Dig Duck — Mac App Store submission draft

App Store Connect draft created and verified on September 25, 2026:
https://appstoreconnect.apple.com/apps/6816131193/distribution/macos/version/inflight

Apple ID: `6816131193`. Version 1.1.0 is **Prepare for Submission**. Description, keywords, support URL, copyright, no-sign-in requirement, and review notes were saved and read back. Build 3 was archived, exported with App Store signing, and uploaded successfully on September 25, 2026. Apple reported that the uploaded package was processing. It is not yet attached to the version, and nothing has been submitted for review.

Free pricing was confirmed, saved, and verified after reopening Pricing and Availability on September 25, 2026. Availability was saved for all 175 countries or regions; the returned country list shows “Available on App Release.” No in-app purchases are configured.

The subtitle and Utilities category were saved (App Store Connect showed “Saved”). The published privacy URL was saved and read back. The “Data Not Collected” questionnaire answer was saved as a draft. Publishing that answer presents an explicit agreement about accuracy, legal compliance, and future updates, so the final Publish action remains pending user confirmation.

## App information

- Name: Dig Duck: Dig Spot Finder (the shorter “Dig Duck” was unavailable in App Store Connect)
- Subtitle: Find your missing dig spots
- Platform: macOS 13 or later, Apple silicon and Intel
- Primary category: Utilities
- Bundle ID: `com.digduck.app` (registered and verified in team `UQK4H983JN` on September 25, 2026)
- Version: 1.1.0; build: 3
- SKU: `dig-duck-mac`
- Primary language: English (US)
- Copyright: 2026 Michael Klepacz
- Support URL: https://github.com/mikeklepacz/dig-duck/issues
- Privacy URL (published and fetched successfully on September 25, 2026, commit `d37483a`): https://github.com/mikeklepacz/dig-duck/blob/main/docs/app-store/PRIVACY.md
- Keywords: dig,spots,save,helper,checklist,collectibles,locations,offline

## Description

Still looking for those last dig spots? Dig Duck helps you see what is missing from your Sneaky Sasquatch saves on Mac.

Choose your save folder once, then browse missing locations for each of your three save slots. Search by scene, compare possible wiki guide matches, and copy location details for later.

• A proper Mac app: no Terminal, Homebrew, or browser setup.
• Read-only scanning: your saves are never changed.
• Local processing: your save files stay on your Mac.
• Remembered folder access and one-click rescanning.
• Built-in example results so you can try the interface before selecting saves.

Requires local saves from the Mac version of Sneaky Sasquatch. If you play on another Apple device, first open the Mac game using the same Apple Account and allow supported save syncing to finish.

Location mappings are community-maintained. Some matches are suggestions, and scan totals can differ from the in-game achievement count when a complete baseline is unavailable. This app does not edit saves, unlock achievements, or run inside the game.

Dig Duck is an unofficial community tool, not affiliated with or endorsed by RAC7, Apple, or Fandom. Sneaky Sasquatch is a separate game and is not included.

## What’s new

Dig Duck now opens in its own Mac window. Choose your save folder through the standard macOS picker, keep access for next time, and rescan without starting a browser or installing developer tools. Includes clearer setup and error messages, a Forget Folder option, and example results.

## App Review notes

No account or purchase is required. The app is a read-only, sandboxed companion utility.

For an immediate walkthrough, choose “Preview with example saves” on the first screen. These fictional example results are visibly labelled and do not access any user files. Search, save-slot selection, guide links, and copy actions can be inspected from this screen.

For a real scan, install and play the Mac version of Sneaky Sasquatch, quit it, then choose “Open My Saves” and confirm “Allow Access” in the macOS permission window. The picker suggests the standard game save location. The user must grant access. Dig Duck requests read-only user-selected file access and persists it as a security-scoped bookmark. “Forget Folder” deletes that bookmark. The app reads map, achievements, and character JSON `.stuff` files for the three supported slots; it never writes to game files.

The bundled interface runs in WKWebView. The network-client entitlement is required by WebKit for loading local resources. The app has no listening server, and the bundled page’s content-security policy blocks network requests. Guide/support links open in the system browser only after the user clicks them.

## Remaining submission work

- Xcode setup and account sign-in are complete. The real Xcode archive succeeded.
- Automatic App Store signing/provisioning and export succeeded after the user signed into Xcode.
- Upload completed through Xcode (`release/upload.log` records “Upload succeeded”). Wait for App Store Connect processing and attach build 3 before review.
- The privacy URL is saved in App Store Connect. Obtain confirmation for the final privacy-publication agreement; verify the support page before final submission.
- Capture final Mac App Store screenshots at an accepted size from the final build; keep example data labelled.
- Confirm rights for the existing wiki text and game screenshots. Wiki community licensing does not by itself establish rights to every game image. Do not make an affirmative content-rights declaration without evidence.
- Age-rating questionnaire is saved; App Store Connect reports global 4+ with regional exceptions. Privacy draft is saved but final declaration awaits confirmation. Review contact details are requested from the user. Existing account state identifies the developer as a trader; this was not changed.
- Test access to actual game-container saves and the initial suggested folder on a Mac with the game installed. This machine had no saves at that location during preparation. Test the supported minimum OS and Intel runtime before claiming those were runtime-tested.

Apple review and approval are external steps; preparation or upload alone is not publication.
