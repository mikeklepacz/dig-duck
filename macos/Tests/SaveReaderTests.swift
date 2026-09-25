import Foundation

@main
struct SaveReaderTests {
    static func main() throws {
        let root = FileManager.default.temporaryDirectory.resolvingSymlinksInPath()
            .appendingPathComponent("dig-duck-tests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: root) }
        let maps = root.appendingPathComponent("default/map")
        try FileManager.default.createDirectory(at: maps, withIntermediateDirectories: true)
        let save = maps.appendingPathComponent("sample.stuff")
        let original = Data("{\"objects\":[{\"st\":\"digsite\",\"id\":\"123\",\"hd\":0}]}".utf8)
        try original.write(to: save)
        try Data("{\"13\":0}".utf8).write(to: root.appendingPathComponent("default/achievements.stuff"))
        try Data("private unrelated data".utf8).write(to: root.appendingPathComponent("unrelated.txt"))
        let result = try SaveReader.read(folder: root)
        let files = result["files"] as! [[String: Any]]
        precondition(files.count == 2 && files.contains { ($0["path"] as? String) == "default/map/sample.stuff" })
        let afterScan = try Data(contentsOf: save)
        precondition(afterScan == original, "Read must not change saves")
        print("✓ Valid save scan reads only allowed files and preserves bytes")

        try Data("not json".utf8).write(to: save)
        expectFailure("Malformed save does not become a misleading empty result") { _ = try SaveReader.read(folder: root) }
        try original.write(to: save)
        let link = maps.appendingPathComponent("linked.stuff")
        try FileManager.default.createSymbolicLink(at: link, withDestinationURL: save)
        expectFailure("Symbolic links are rejected") { _ = try SaveReader.read(folder: root) }
        try FileManager.default.removeItem(at: link)
        let huge = maps.appendingPathComponent("huge.stuff")
        try Data(repeating: 32, count: SaveReader.maxFileBytes + 1).write(to: huge)
        expectFailure("Oversized files are bounded") { _ = try SaveReader.read(folder: root) }
        try FileManager.default.removeItem(at: huge)
        let empty = root.appendingPathComponent("empty")
        try FileManager.default.createDirectory(at: empty, withIntermediateDirectories: true)
        expectFailure("Wrong folders give actionable errors") { _ = try SaveReader.read(folder: empty) }
        print("All native save-reader tests passed")
    }

    static func expectFailure(_ name: String, _ action: () throws -> Void) {
        do { try action(); fatalError("Expected error: \(name)") }
        catch { print("✓ \(name)") }
    }
}
