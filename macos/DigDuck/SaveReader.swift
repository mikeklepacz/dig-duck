import Foundation
import Darwin

struct SaveReadError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

// Reads only the three game slots. Never opens a save for writing, follows a
// symlink, or recursively searches unrelated folders.
enum SaveReader {
    static let slotIDs = ["default", "default2", "default3"]
    static let maxFileBytes = 4 * 1024 * 1024
    static let maxTotalBytes = 32 * 1024 * 1024
    static let maxFiles = 1200

    static func read(folder: URL) throws -> [String: Any] {
        let root = folder.standardizedFileURL
        var files: [[String: Any]] = []
        var totalBytes = 0
        try requireDirectory(root)
        for slot in slotIDs {
            let slotURL = root.appendingPathComponent(slot, isDirectory: true)
            guard try isExistingDirectory(slotURL) else { continue }
            for name in ["achievements.stuff", "sasquatch.stuff"] {
                let url = slotURL.appendingPathComponent(name)
                guard try exists(url) else { continue }
                try append(url, relativePath: "\(slot)/\(name)", files: &files, totalBytes: &totalBytes)
            }
            let mapURL = slotURL.appendingPathComponent("map", isDirectory: true)
            guard try isExistingDirectory(mapURL) else { continue }
            let names = try FileManager.default.contentsOfDirectory(at: mapURL,
                includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey],
                options: [.skipsHiddenFiles])
            guard names.count <= maxFiles else {
                throw SaveReadError(message: "That folder contains too many files. Choose the Sneaky Sasquatch save folder.")
            }
            for url in names.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }) where url.pathExtension == "stuff" {
                try append(url, relativePath: "\(slot)/map/\(url.lastPathComponent)", files: &files, totalBytes: &totalBytes)
            }
        }
        guard files.contains(where: { ($0["path"] as? String)?.contains("/map/") == true }) else {
            throw SaveReadError(message: "No game saves found here. Play Sneaky Sasquatch on this Mac, quit the game, then choose its save folder. iPhone-only saves must first sync through the Mac game.")
        }
        return ["files": files, "folderName": root.lastPathComponent]
    }

    private static func exists(_ url: URL) throws -> Bool {
        do {
            _ = try url.resourceValues(forKeys: [.isDirectoryKey])
            return true
        } catch let error as NSError where error.domain == NSCocoaErrorDomain && error.code == NSFileReadNoSuchFileError {
            return false
        }
    }

    private static func isExistingDirectory(_ url: URL) throws -> Bool {
        guard try exists(url) else { return false }
        try requireDirectory(url)
        return true
    }

    private static func requireDirectory(_ url: URL) throws {
        let values = try url.resourceValues(forKeys: [.isDirectoryKey, .isSymbolicLinkKey])
        guard values.isDirectory == true, values.isSymbolicLink != true,
              url.resolvingSymlinksInPath().path == url.standardizedFileURL.path else {
            throw SaveReadError(message: "Choose the original save folder, rather than an alias or symbolic link.")
        }
    }

    private static func append(_ url: URL, relativePath: String, files: inout [[String: Any]], totalBytes: inout Int) throws {
        let values = try url.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey, .contentModificationDateKey])
        guard values.isRegularFile == true, values.isSymbolicLink != true else {
            throw SaveReadError(message: "A save file is not a regular file. Choose the original game save folder.")
        }
        guard files.count < maxFiles, let size = values.fileSize, size <= maxFileBytes,
              totalBytes + size <= maxTotalBytes else {
            throw SaveReadError(message: "These saves are larger than Dig Duck can safely read. No files were changed.")
        }
        // Bound the read even if the game replaces or grows a file after stat.
        let descriptor = Darwin.open(url.path, O_RDONLY | O_NOFOLLOW | O_NONBLOCK)
        guard descriptor >= 0 else {
            throw SaveReadError(message: "A save became unavailable. Quit the game and try again.")
        }
        let handle = FileHandle(fileDescriptor: descriptor, closeOnDealloc: true)
        defer { try? handle.close() }
        var metadata = stat()
        guard fstat(descriptor, &metadata) == 0, metadata.st_mode & S_IFMT == S_IFREG else {
            throw SaveReadError(message: "A save is not a regular file. Choose the original game save folder.")
        }
        let data = try handle.read(upToCount: maxFileBytes + 1) ?? Data()
        guard data.count <= maxFileBytes, totalBytes + data.count <= maxTotalBytes,
              let text = String(data: data, encoding: .utf8),
              (try? JSONSerialization.jsonObject(with: data)) is [String: Any] else {
            throw SaveReadError(message: "A save could not be read. Quit Sneaky Sasquatch and try again. Your saves were not changed.")
        }
        totalBytes += data.count
        files.append(["path": relativePath, "text": text,
                      "modified": (values.contentModificationDate?.timeIntervalSince1970 ?? 0) * 1000])
    }
}
