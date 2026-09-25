import AppKit
import WebKit

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
    private var window: NSWindow!
    private var webView: WKWebView!
    private let saves = SaveAccess()
    private var webRoot: URL!
    private var recoveredWebProcess = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        createMenus()
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "digDuck")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1180, height: 800),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Dig Duck"
        window.minSize = NSSize(width: 720, height: 560)
        window.contentView = webView
        window.setFrameAutosaveName("DigDuckMainWindow")
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        guard let root = Bundle.main.resourceURL?.appendingPathComponent("Web", isDirectory: true),
              FileManager.default.fileExists(atPath: root.appendingPathComponent("index.html").path) else {
            showFailure("Dig Duck’s app files are missing. Reinstall the app and try again.")
            return
        }
        webRoot = root.standardizedFileURL
        webView.loadFileURL(root.appendingPathComponent("index.html"), allowingReadAccessTo: root)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame,
              let url = message.frameInfo.request.url, isBundledPage(url),
              let body = message.body as? [String: Any], let action = body["action"] as? String else {
            replyHandler(nil, "This request is not allowed.")
            return
        }
        if action == "copy", let text = body["text"] as? String, text.utf8.count <= 16_384 {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(text, forType: .string)
            replyHandler(["copied": true], nil)
        } else if ["choose", "restore", "rescan", "forget"].contains(action), body.count == 1 {
            saves.perform(action: action, window: window, reply: replyHandler)
        } else {
            replyHandler(nil, "Unknown Dig Duck action.")
        }
    }

    private func isBundledPage(_ url: URL) -> Bool {
        guard let webRoot else { return false }
        return url.isFileURL && url.standardizedFileURL.path == webRoot.appendingPathComponent("index.html").path
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if isBundledPage(url) {
            decisionHandler(.allow)
        } else {
            if navigationAction.navigationType == .linkActivated, url.scheme == "https" {
                NSWorkspace.shared.open(url)
            }
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.scheme == "https", navigationAction.navigationType == .linkActivated {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        guard !recoveredWebProcess else {
            showFailure("macOS could not start Dig Duck’s display. Quit and reopen the app.")
            return
        }
        recoveredWebProcess = true
        webView.reload()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showFailure("Dig Duck could not open its window. Quit and reopen the app, or reinstall it if this continues.")
    }

    private func showFailure(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "Dig Duck couldn’t start"
        alert.informativeText = message
        alert.addButton(withTitle: "Quit")
        alert.runModal()
        NSApp.terminate(nil)
    }

    private func createMenus() {
        let menu = NSMenu()
        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Dig Duck", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide Dig Duck", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: "Quit Dig Duck", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        menu.addItem(appItem)
        let editItem = NSMenuItem()
        let edit = NSMenu(title: "Edit")
        for (title, selector, key) in [("Copy", "copy:", "c"), ("Paste", "paste:", "v"), ("Cut", "cut:", "x"), ("Select All", "selectAll:", "a")] {
            edit.addItem(withTitle: title, action: Selector(selector), keyEquivalent: key)
        }
        editItem.submenu = edit
        menu.addItem(editItem)
        let windowItem = NSMenuItem()
        let windowMenu = NSMenu(title: "Window")
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.zoom(_:)), keyEquivalent: "")
        windowItem.submenu = windowMenu
        menu.addItem(windowItem)
        NSApp.windowsMenu = windowMenu
        NSApp.mainMenu = menu
    }
}
