import XCTest

final class EventTests: XCTestCase {

    var app: XCUIApplication!
    var logPath: String!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        logPath = NSTemporaryDirectory() + UUID().uuidString + ".jsonl"
        app = TestHelper.launchApp(
            "events_app.ts",
            extraDenoFlags: ["--allow-write"],
            extraArgs: [logPath]
        )
    }

    override func tearDown() {
        app.terminate()
        try? FileManager.default.removeItem(atPath: logPath)
        super.tearDown()
    }

    // MARK: - Helpers

    private func clearLog() {
        FileManager.default.createFile(atPath: logPath, contents: nil)
        Thread.sleep(forTimeInterval: 0.1)
    }

    private func readLog() -> String {
        Thread.sleep(forTimeInterval: 0.3)
        return (try? String(contentsOfFile: logPath, encoding: .utf8)) ?? ""
    }

    private func assertEventSnapshot(
        named name: String, file: StaticString = #file, line: UInt = #line
    ) {
        let text = readLog()
        let data = text.data(using: .utf8)!
        SnapshotHelper.assertSnapshot(
            data, named: "\(name).jsonl",
            compare: { baseline in
                let baselineText = String(data: baseline, encoding: .utf8) ?? ""
                if baselineText == text { return nil }
                return
                    "Text snapshot mismatch for \(name):\n--- baseline ---\n\(baselineText)\n--- actual ---\n\(text)"
            }, file: file, line: line)
    }

    private func parseEvents() -> [[String: Any]] {
        let text = readLog()
        return text.split(separator: "\n").compactMap { line in
            guard let data = line.data(using: .utf8),
                let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else { return nil }
            return obj
        }
    }

    /// Move cursor to position and wait for events to settle before clearing the log.
    private func settleAt(_ coord: XCUICoordinate) {
        coord.hover()
        Thread.sleep(forTimeInterval: 0.3)
        clearLog()
    }

    // MARK: - mouse

    func testClick() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.click()
        center.rightClick()
        center.doubleTap()
        assertEventSnapshot(named: "testClick")
    }

    // MARK: - drag

    func testDrag() {
        let window = app.windows.firstMatch
        let from = window.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.25))
        let to = window.coordinate(withNormalizedOffset: CGVector(dx: 0.75, dy: 0.75))
        settleAt(from)
        from.press(forDuration: 0.1, thenDragTo: to)

        let events = parseEvents()
        XCTAssertGreaterThanOrEqual(events.count, 3, "Expected mousedown + mousemoves + mouseup")

        XCTAssertEqual(events.first?["type"] as? String, "mousedown")
        for event in events.dropFirst().dropLast() {
            XCTAssertEqual(event["type"] as? String, "mousemove")
            let detail = event["detail"] as! [String: Any]
            XCTAssertEqual(detail["buttons"] as? Int, 1)
        }

        XCTAssertEqual(events.last?["type"] as? String, "mouseup")
        if let lastDetail = events.last?["detail"] as? [String: Any] {
            XCTAssertEqual(lastDetail["button"] as? Int, 0)
        }
    }

    // MARK: - keydown / keyup

    func testAllKeys() {
        clearLog()

        for ch in "abcdefghijklmnopqrstuvwxyz0123456789" {
            app.typeKey(String(ch), modifierFlags: [])
        }

        // Modifier combinations
        app.typeKey("a", modifierFlags: .shift)
        app.typeKey("a", modifierFlags: .control)
        app.typeKey("a", modifierFlags: [.control, .shift])
        app.typeKey("a", modifierFlags: .command)
        app.typeKey("a", modifierFlags: [.command, .shift])
        app.typeKey("a", modifierFlags: [.control, .command])
        app.typeKey("a", modifierFlags: .option)
        app.typeKey("a", modifierFlags: [.control, .option])
        app.typeKey("a", modifierFlags: [.command, .option])
        app.typeKey("a", modifierFlags: [.shift, .option])
        app.typeKey("a", modifierFlags: [.control, .option, .command])

        let specialKeys: [XCUIKeyboardKey] = [
            .return, .tab, .delete, .escape,
            .leftArrow, .rightArrow, .upArrow, .downArrow,
            .home, .end, .pageUp, .pageDown, .forwardDelete,
            .F1, .F2, .F3, .F4, .F5, .F6, .F7, .F8, .F9, .F10, .F11, .F12,
        ]

        for key in specialKeys {
            app.typeKey(key, modifierFlags: [])
        }

        assertEventSnapshot(named: "testAllKeys")
    }

    // MARK: - wheel

    func testScroll() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.scroll(byDeltaX: 0, deltaY: 3)
        center.scroll(byDeltaX: 0, deltaY: -2)
        center.scroll(byDeltaX: 0, deltaY: 5)

        center.scroll(byDeltaX: 3, deltaY: 0)
        center.scroll(byDeltaX: -2, deltaY: 0)
        center.scroll(byDeltaX: 5, deltaY: 0)
        assertEventSnapshot(named: "testScroll")
    }

    // MARK: - resize

    func testResize() {
        let window = app.windows.firstMatch
        let bottomRight = window.coordinate(withNormalizedOffset: CGVector(dx: 1.0, dy: 1.0))
        let target = bottomRight.withOffset(CGVector(dx: 50, dy: 50))
        settleAt(bottomRight)
        bottomRight.press(forDuration: 0.1, thenDragTo: target)

        let events = parseEvents()
        XCTAssertGreaterThan(events.count, 3, "Expected more than 3 resize events")
        for event in events {
            XCTAssertEqual(event["type"] as? String, "resize")
            let detail = event["detail"] as! [String: Any]
            let w = detail["width"] as! Int
            let h = detail["height"] as! Int
            XCTAssertGreaterThanOrEqual(w, 400)
            XCTAssertLessThanOrEqual(w, 450)
            XCTAssertGreaterThanOrEqual(h, 300)
            XCTAssertLessThanOrEqual(h, 350)
        }
        let lastDetail = events.last!["detail"] as! [String: Any]
        XCTAssertEqual(lastDetail["width"] as? Int, 450)
        XCTAssertEqual(lastDetail["height"] as? Int, 350)
    }

    // MARK: - focus / blur

    func testFocusAndBlur() {
        clearLog()
        let finder = XCUIApplication(bundleIdentifier: "com.apple.finder")
        finder.activate()
        Thread.sleep(forTimeInterval: 0.5)
        app.activate()
        Thread.sleep(forTimeInterval: 0.5)
        assertEventSnapshot(named: "testFocusAndBlur")
    }
}
