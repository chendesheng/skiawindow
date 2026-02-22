import XCTest
import AppKit
import SnapshotTesting

enum SnapshotHelper {

    private static let isUpdateMode: Bool = {
        ProcessInfo.processInfo.environment["SNAPSHOT_UPDATE"] == "1"
    }()

    static let baselineDir: String = {
        TestHelper.projectRoot + "/tests/__snapshots__"
    }()

    static let outputDir: String = {
        let dir = NSTemporaryDirectory() + "skiawindow_snapshots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        return dir
    }()

    private static var manifest: [String: [String]] = ["missing": [], "updated": []]

    static func assertSnapshot(
        _ image: NSImage,
        named name: String,
        precision: Float = 0.99,
        perceptualPrecision: Float = 0.98,
        record: Bool = false,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        let path = "\(baselineDir)/\(name).png"
        let fm = FileManager.default
        let shouldRecord = record || isUpdateMode

        guard let pngData = pngRepresentation(image) else {
            XCTFail("Failed to convert screenshot to PNG", file: file, line: line)
            return
        }

        // Case 1: Baseline missing -- auto-record
        if !fm.fileExists(atPath: path) {
            let outPath = "\(outputDir)/\(name).png"
            do {
                try pngData.write(to: URL(fileURLWithPath: outPath))
                appendToManifest(name, reason: "missing")
                XCTFail("Recorded new baseline: \(name). Re-run to verify.", file: file, line: line)
            } catch {
                XCTFail("Failed to write snapshot: \(error)", file: file, line: line)
            }
            return
        }

        // Case 2: Baseline exists -- compare
        guard let baselineData = fm.contents(atPath: path),
              let baselineImage = NSImage(data: baselineData) else {
            XCTFail("Failed to load baseline at \(path)", file: file, line: line)
            return
        }

        let diffing = Diffing<NSImage>.image(precision: precision, perceptualPrecision: perceptualPrecision)
        guard let (message, attachments) = diffing.diff(baselineImage, image) else {
            return  // Match -- pass silently
        }

        // Case 2b: Mismatch + update mode -- record replacement
        if shouldRecord {
            let outPath = "\(outputDir)/\(name).png"
            do {
                try pngData.write(to: URL(fileURLWithPath: outPath))
                appendToManifest(name, reason: "updated")
                XCTFail("Updated snapshot: \(name). Run `deno task test:ui:update` to accept.", file: file, line: line)
            } catch {
                XCTFail("Failed to write snapshot: \(error)", file: file, line: line)
            }
            return
        }

        // Case 2c: Mismatch + normal mode -- report failure
        let failPath = "\(outputDir)/\(name)_FAIL.png"
        try? pngData.write(to: URL(fileURLWithPath: failPath))
        for attachment in attachments {
            attachment.lifetime = .keepAlways
            XCTContext.runActivity(named: "Snapshot diff: \(name)") { activity in
                activity.add(attachment)
            }
        }
        XCTFail("\(message)", file: file, line: line)
    }

    private static func appendToManifest(_ name: String, reason: String) {
        manifest[reason]?.append(name)
        let manifestPath = "\(outputDir)/manifest.json"
        let data = try? JSONSerialization.data(withJSONObject: manifest)
        try? data?.write(to: URL(fileURLWithPath: manifestPath))
    }

    private static func pngRepresentation(_ image: NSImage) -> Data? {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
        let rep = NSBitmapImageRep(cgImage: cgImage)
        rep.size = image.size
        return rep.representation(using: .png, properties: [:])
    }
}
