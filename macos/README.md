# Native Mac app

Dig Duck uses a small Swift/AppKit host and the existing React scanner in a bundled WKWebView. It does not start Express, Node, a browser, or any listening network service. Node/npm are build tools only.

## Local build

```sh
npm ci
npm run mac:build
```

Result: `release/native/Dig Duck.app`. The default signature is ad hoc for local QA and is **not** suitable for public release or App Store upload. The script compiles both arm64 and x86_64 using Apple’s installed SDK, then verifies the bundle signature. The app requires macOS 13+.

Existing wiki image files must be available in `public/wiki-images` to include the guide illustrations. `npm run fetch:wiki` is the existing download command. Distribution rights must be resolved before submitting those assets.

## Xcode / Mac App Store

1. Run `npm run mac:prepare` to generate the offline interface in `macos/Generated/Web`.
2. Open `macos/DigDuck.xcodeproj` in Xcode.
3. Sign in using the existing developer membership. The project’s team ID is taken from the installed Michael Klepacz development certificate; confirm the correct team is selected.
4. Confirm the bundle ID is registered and automatic signing succeeds. Do not replace or revoke certificates used by other apps.
5. Select the **DigDuck** scheme, **Any Mac**, and **Product → Archive**.
6. Validate and distribute through App Store Connect using Mac App Store signing.
7. Use the prepared listing/privacy text in `docs/app-store` and set the app price to free.

The shared Xcode project uses the same Swift sources, sandbox entitlements, privacy manifest, icon, and generated offline web bundle as the local build. Run `mac:prepare` after every web-code change before building in Xcode. No iOS simulators are needed for this Mac-only app.

## Verification

```sh
npm run typecheck
npm run test:native
npm run mac:build
```

Native unit tests use temporary synthetic files and check read-only scanning, malformed input, size bounds, and symlink rejection. TypeScript tests check bridge/scanner parity, cancelled selection, missing permissions, and example data.

The initial local app was exercised on Apple silicon with App Sandbox enabled: rendering, bundled images, example preview, cancel, wrong-folder recovery, folder scan, rescan, copying, and bookmark restoration after quit/relaunch. Forget Folder was also confirmed to remove the app’s saved bookmark. This is not proof of access to the real game container, Intel runtime compatibility, App Store validation, or Apple approval.

## Data boundaries

- User permission is requested with `NSOpenPanel`, using read-only user-selected access.
- Only `default`, `default2`, and `default3` are scanned. Each slot reads `map/*.stuff`, `achievements.stuff`, and `sasquatch.stuff`.
- No arbitrary paths are accepted over the JS bridge. Only the bundled main page can invoke its fixed actions.
- Files are bounded, regular-file-only JSON input. The picker grant is released after each scan.
- Persistent bookmarks are read-only; forgetting a folder removes the bookmark.
- External pages never load inside the privileged web view. HTTPS links open in the system browser.
- WebKit requires a network-client entitlement even for bundled resources. A restrictive CSP blocks connections from the app page, and no app code uploads saves.
