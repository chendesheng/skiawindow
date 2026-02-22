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

    /// Generic snapshot assertion.
    ///
    /// - Parameters:
    ///   - data: Serialized actual snapshot (PNG bytes, UTF-8 text, etc.)
    ///   - name: File name **including extension** (e.g. "testFoo.png", "testBar.jsonl").
    ///   - compare: Receives the baseline `Data`; return `nil` on match or an
    ///     error message on mismatch.  The actual value can be captured from context.
    static func assertSnapshot(
        _ data: Data,
        named name: String,
        compare: (Data) -> String?,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        let path = "\(baselineDir)/\(name)"
        let fm = FileManager.default
        let shouldRecord = isUpdateMode

        // Case 1: Baseline missing -- auto-record
        if !fm.fileExists(atPath: path) {
            let outPath = "\(outputDir)/\(name)"
            do {
                try data.write(to: URL(fileURLWithPath: outPath))
                appendToManifest(name, reason: "missing")
                XCTFail("Recorded new baseline: \(name). Re-run to verify.", file: file, line: line)
            } catch {
                XCTFail("Failed to write snapshot: \(error)", file: file, line: line)
            }
            return
        }

        // Case 2: Baseline exists -- compare
        guard let baselineData = fm.contents(atPath: path) else {
            XCTFail("Failed to load baseline at \(path)", file: file, line: line)
            return
        }

        guard let message = compare(baselineData) else {
            return  // Match -- pass silently
        }

        // Case 2b: Mismatch + update mode -- record replacement
        if shouldRecord {
            let outPath = "\(outputDir)/\(name)"
            do {
                try data.write(to: URL(fileURLWithPath: outPath))
                appendToManifest(name, reason: "updated")
                XCTFail("Updated snapshot: \(name). Run `deno task test:ui:update` to accept.", file: file, line: line)
            } catch {
                XCTFail("Failed to write snapshot: \(error)", file: file, line: line)
            }
            return
        }

        // Case 2c: Mismatch + normal mode -- report failure
        let stem = (name as NSString).deletingPathExtension
        let ext = (name as NSString).pathExtension
        let failName = "\(stem)_FAIL.\(ext)"
        let failPath = "\(outputDir)/\(failName)"
        try? data.write(to: URL(fileURLWithPath: failPath))
        XCTFail("\(message)", file: file, line: line)
    }

    // MARK: - Image convenience

    static func assertImageSnapshot(
        _ image: NSImage,
        named name: String,
        precision: Float = 0.99,
        perceptualPrecision: Float = 0.98,
        file: StaticString = #file,
        line: UInt = #line
    ) {
        guard let pngData = pngRepresentation(image) else {
            XCTFail("Failed to convert screenshot to PNG", file: file, line: line)
            return
        }

        assertSnapshot(pngData, named: "\(name).png", compare: { baselineData in
            guard let baselineImage = NSImage(data: baselineData) else {
                return "Failed to decode baseline image"
            }
            let diffing = Diffing<NSImage>.image(precision: precision, perceptualPrecision: perceptualPrecision)
            guard let (message, attachments) = diffing.diff(baselineImage, image) else {
                return nil
            }
            for attachment in attachments {
                attachment.lifetime = .keepAlways
                XCTContext.runActivity(named: "Snapshot diff: \(name)") { activity in
                    activity.add(attachment)
                }
            }
            return message
        }, file: file, line: line)
    }

    // MARK: - Private

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
