# Dig Duck — Mac App Store submission draft

App Store Connect draft created and verified on September 25, 2026:
https://appstoreconnect.apple.com/apps/6816131193/distribution/macos/version/inflight

Apple ID: `6816131193`. Version 1.1.0 is **Prepare for Submission**. Description, keywords, support URL, copyright, no-sign-in requirement, and review notes were saved and read back. Build 3 was archived, exported with App Store signing, and uploaded successfully on September 25, 2026. Apple finished processing it; build 1.1.0 (3) and the reviewer contact details supplied by the user are now saved to the version. The encryption questionnaire was saved with “None of the algorithms mentioned above,” and the missing-compliance warning cleared. Saved review notes match the “Open My Saves” and “Allow Access” interface. Nothing has been submitted for review.

Free pricing was confirmed, saved, and verified after reopening Pricing and Availability on September 25, 2026. Availability was saved for all 175 countries or regions; the returned country list shows “Available on App Release.” No in-app purchases are configured.

The subtitle and Utilities category were saved (App Store Connect showed “Saved”). The published privacy URL was saved and read back. The user published “Data Not Collected”; App Store Connect confirmed publication by Michael Klepacz.

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

## Submission status

September 26 local correction: build 4 fixes a false missing dig spot when the game's completion counter reports all 116 but only 115 individual location records are stored. The UI preserves that distinction instead of inventing a missing location. A partial save whose counter merely matches its observed records is no longer used as a completed-game baseline. Slots without downloaded local records now explain how to load them in the Mac game and rescan. Five TypeScript regression/bridge tests, the native reader checks, typechecking, and the universal local app build passed. The native build was opened and verified against the user's real Save 1: 116/116, zero missing, day 916. Only the default slot existed locally at that check; slots 2 and 3 remain unverified until downloaded. Build 4 must replace build 3 in the submission; see the upload status below.

Follow-up verification: all three local save folders subsequently became available. The revised parser reports Save 1 as 116/116 (day 916), Save 2 using its game counter of 60 completed (day 221), and Save 3 as available (day 139) with no dig-achievement counter in its file. Partial-save summaries use a valid game counter when available and distinguish candidate location lists when map/catalog counts disagree. Without a usable counter, totals are explicitly labelled estimates. Six TypeScript tests plus the native reader tests pass. Build 4 was archived successfully and uploaded on September 26 at 12:29 Europe/Warsaw; release/upload-build4.log records “Upload succeeded” and “Uploaded package is processing.” Attachment to the App Store version remains unverified because browser control timed out while reconnecting to the expired App Store Connect session. No review submission has occurred.

- Xcode setup and account sign-in are complete. The real Xcode archive succeeded.
- Automatic App Store signing/provisioning and export succeeded after the user signed into Xcode.
- Upload completed through Xcode (`release/upload.log` records “Upload succeeded”). Processing completed and the encryption questionnaire is complete. Build 3 and reviewer contacts are saved. Apple submission validation reports three remaining requirements: at least one screenshot, Content Rights Information, and published App Privacy answers.
- The privacy URL and published “Data Not Collected” answer are saved in App Store Connect.
- Capture final Mac App Store screenshots at an accepted size from the final build; keep example data labelled.
- The user instructed us to retain the wiki/game images and proceed for Apple review. Apple requires the declaration “Yes, it contains, shows, or accesses third-party content, and I have the necessary rights.” The user explicitly authorized this declaration after being shown its wording. It was selected and saved; App Store Connect displayed “Saved” and “Yes, this app has the necessary rights to its third-party content.” This records the user declaration, not independent verification of licenses.
- Age-rating questionnaire is saved; App Store Connect reports global 4+ with regional exceptions. Privacy answers are published. Review contact details supplied by the user are saved. Existing account state identifies the developer as a trader; this was not changed.
- Real game-container access and automatic picker navigation were verified after the user reinstalled the game. The remembered bookmark restored access in local build 4. Minimum supported OS and Intel runtime have not been runtime-tested.

Apple review and approval are external steps; preparation or upload alone is not publication.

## Submitted September 26, 2026

Version 1.1.0 (build 4) was attached and its encryption questionnaire completed. The actual native app capture with explicitly labelled example saves was resized proportionally and padded to 2880 x 1800 for the listing; App Store Connect accepted it. Reviewer contact information was saved. Validation passed, and Submit for Review succeeded at 12:38 Europe/Warsaw. Apple displayed “1 Item Submitted” and “Waiting for Review.”

Submission: https://appstoreconnect.apple.com/apps/6816131193/distribution/reviewsubmissions/details/41dc6815-dc80-4462-9dbb-299bf90fdb7a

This supersedes the pending-submission statements in the chronological notes above. Automatic release after approval is selected. The app is submitted, not yet approved or publicly released.
