import AppKit

// Rasterize the project's existing duck vector design into Apple's icon sizes.
let destination = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: destination, withIntermediateDirectories: true)
func color(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat) -> NSColor {
    NSColor(srgbRed: r / 255, green: g / 255, blue: b / 255, alpha: 1)
}
for size in [16, 32, 128, 256, 512] {
    for scale in [1, 2] {
        let pixels = size * scale
        let image = NSImage(size: NSSize(width: pixels, height: pixels))
        image.lockFocus()
        let transform = NSAffineTransform()
        transform.scale(by: CGFloat(pixels) / 64)
        transform.concat()
        color(36, 95, 71).setFill()
        NSBezierPath(roundedRect: NSRect(x: 3, y: 3, width: 58, height: 58), xRadius: 13, yRadius: 13).fill()
        color(245, 197, 66).setFill()
        NSBezierPath(ovalIn: NSRect(x: 12, y: 12, width: 40, height: 40)).fill()
        color(240, 138, 36).setFill()
        let beak = NSBezierPath()
        beak.move(to: NSPoint(x: 45, y: 34)); beak.line(to: NSPoint(x: 57, y: 34))
        beak.line(to: NSPoint(x: 45, y: 26)); beak.close(); beak.fill()
        color(30, 43, 31).setFill()
        NSBezierPath(ovalIn: NSRect(x: 22, y: 36, width: 6, height: 6)).fill()
        color(30, 43, 31).setStroke()
        let smile = NSBezierPath()
        smile.move(to: NSPoint(x: 20, y: 25))
        smile.curve(to: NSPoint(x: 45, y: 25), controlPoint1: NSPoint(x: 27, y: 20), controlPoint2: NSPoint(x: 38, y: 20))
        smile.lineWidth = 4; smile.lineCapStyle = .round; smile.stroke()
        image.unlockFocus()
        let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
        let data = bitmap.representation(using: .png, properties: [:])!
        let suffix = scale == 2 ? "@2x" : ""
        try data.write(to: destination.appendingPathComponent("icon_\(size)x\(size)\(suffix).png"))
    }
}
