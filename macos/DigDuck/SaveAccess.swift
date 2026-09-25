import AppKit

@MainActor
final class SaveAccess {
    private let bookmarkKey = "saveFolderBookmark"
    private var busy = false

    func perform(action: String, window: NSWindow, reply: @escaping (Any?, String?) -> Void) {
        guard !busy else { reply(nil, "A scan is already in progress."); return }
        if action == "forget" {
            UserDefaults.standard.removeObject(forKey: bookmarkKey)
            reply(["forgotten": true], nil)
            return
        }
        busy = true
        if action == "choose" {
            let panel = NSOpenPanel()
            panel.title = "Allow Dig Duck to read your saves"
            panel.message = "Dig Duck opens the standard Sneaky Sasquatch save location for you. Click Allow Access to read your progress. Your saves will not be changed. If no saves are shown, open the Mac game and load your save first."
            panel.prompt = "Allow Access"
            panel.canChooseFiles = false
            panel.canChooseDirectories = true
            panel.allowsMultipleSelection = false
            panel.canCreateDirectories = false
            panel.showsHiddenFiles = true
            if let home = getpwuid(getuid())?.pointee.pw_dir {
                panel.directoryURL = URL(fileURLWithPath: String(cString: home), isDirectory: true)
                    .appendingPathComponent("Library/Containers/com.rac7.SneakySasquatchMac/Data/Library/Application Support/com.rac7.SneakySasquatchMac", isDirectory: true)
            }
            panel.beginSheetModal(for: window) { [weak self] response in
                guard let self else { return }
                guard response == .OK, let url = panel.url else {
                    self.busy = false
                    reply(["cancelled": true], nil)
                    return
                }
                self.scan(url: url, remember: true, reply: reply)
            }
        } else {
            guard let bookmark = UserDefaults.standard.data(forKey: bookmarkKey) else {
                busy = false
                reply(["needsFolder": true], nil)
                return
            }
            do {
                var stale = false
                let url = try URL(resolvingBookmarkData: bookmark,
                                  options: [.withSecurityScope, .withoutUI],
                                  relativeTo: nil, bookmarkDataIsStale: &stale)
                scan(url: url, remember: stale, reply: reply)
            } catch {
                busy = false
                UserDefaults.standard.removeObject(forKey: bookmarkKey)
                reply(nil, "Click Open My Saves to renew macOS permission to read your progress.")
            }
        }
    }

    private func scan(url: URL, remember: Bool, reply: @escaping (Any?, String?) -> Void) {
        let accessed = url.startAccessingSecurityScopedResource()
        // Open-panel grants can be usable even when startAccessing returns false.
        DispatchQueue.global(qos: .userInitiated).async {
            let result = Result { try SaveReader.read(folder: url) }
            DispatchQueue.main.async {
                defer {
                    if accessed { url.stopAccessingSecurityScopedResource() }
                    self.busy = false
                }
                switch result {
                case .success(var payload):
                    if remember {
                        do {
                            let bookmark = try url.bookmarkData(options: [.withSecurityScope, .securityScopeAllowOnlyReadAccess],
                                                               includingResourceValuesForKeys: nil, relativeTo: nil)
                            UserDefaults.standard.set(bookmark, forKey: self.bookmarkKey)
                        } catch {
                            payload["warning"] = "Your saves were read, but macOS could not remember this folder. Choose it again next time."
                        }
                    }
                    reply(payload, nil)
                case .failure(let error):
                    let message = (error as? SaveReadError)?.message ?? "Dig Duck could not read that folder. Choose it again and allow read access. Quit the game before rescanning."
                    reply(nil, message)
                }
            }
        }
    }
}
