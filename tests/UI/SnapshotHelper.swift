import XCTest
import AppKit
import SnapshotTesting

enum SnapshotHelper {

    static let projectRoot: String = {
        ProcessInfo.processInfo.environment["CSKIA_ROOT"]
            ?? "/Users/chendesheng/Sources/cskia"
    }()

    static let baselineDir: String = {
        projectRoot + "/tests/__snapshots__"
    }()

    static let outputDir: String = {
        let dir = NSTemporaryDirectory() + "cskia_snapshots"
        try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true)
        return dir
    }()

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

        guard let pngData = pngRepresentation(image) else {
            XCTFail("Failed to convert screenshot to PNG", file: file, line: line)
            return
        }

        if record || !fm.fileExists(atPath: path) {
            let outPath = "\(outputDir)/\(name).png"
            do {
                try pngData.write(to: URL(fileURLWithPath: outPath))
                XCTFail("Recorded snapshot to: \(outPath). Copy to \(path) as baseline, then re-run without record mode.", file: file, line: line)
            } catch {
                XCTFail("Failed to save snapshot: \(error)", file: file, line: line)
            }
            return
        }

        guard let baselineData = fm.contents(atPath: path),
              let baselineImage = NSImage(data: baselineData) else {
            XCTFail("Failed to load baseline at \(path)", file: file, line: line)
            return
        }

        let diffing = Diffing<NSImage>.image(precision: precision, perceptualPrecision: perceptualPrecision)
        guard let (message, attachments) = diffing.diff(baselineImage, image) else {
            return
        }

        let failPath = "\(outputDir)/\(name)_FAIL.png"
        try? pngData.write(to: URL(fileURLWithPath: failPath))

        for attachment in attachments {
            attachment.lifetime = .keepAlways
            XCTContext.runActivity(named: "Snapshot diff: \(name)") { activity in
                activity.add(attachment)
            }
        }

        XCTFail("\(message) Failure image: tests/__snapshots_output__/\(name)_FAIL.png", file: file, line: line)
    }

    private static func pngRepresentation(_ image: NSImage) -> Data? {
        guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
            return nil
        }
        let rep = NSBitmapImageRep(cgImage: cgImage)
        rep.size = image.size
        return rep.representation(using: .png, properties: [:])
    }
}
