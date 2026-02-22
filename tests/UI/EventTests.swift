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

    private func assertEventSnapshot(named name: String, file: StaticString = #file, line: UInt = #line) {
        let text = readLog()
        let data = text.data(using: .utf8)!
        SnapshotHelper.assertSnapshot(data, named: "\(name).jsonl", compare: { baseline in
            let baselineText = String(data: baseline, encoding: .utf8) ?? ""
            if baselineText == text { return nil }
            return "Text snapshot mismatch for \(name):\n--- baseline ---\n\(baselineText)\n--- actual ---\n\(text)"
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

    // MARK: - mousedown

    func testMouseDownLeft() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.click()
        assertEventSnapshot(named: "testMouseDownLeft")
    }

    func testMouseDownRight() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.rightClick()
        assertEventSnapshot(named: "testMouseDownRight")
    }

    // MARK: - mousemove

    func testMouseMove() {
        let window = app.windows.firstMatch
        let start = window.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.25))
        let end = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(start)
        end.hover()

        let events = parseEvents()
        XCTAssertGreaterThan(events.count, 0, "Expected at least one mousemove event")
        for event in events {
            XCTAssertEqual(event["type"] as? String, "mousemove")
        }
        if let last = events.last, let detail = last["detail"] as? [String: Any] {
            XCTAssertEqual(detail["x"] as? Int, 200)
            XCTAssertEqual(detail["y"] as? Int, 134)
            XCTAssertEqual(detail["button"] as? Int, 0)
            XCTAssertEqual(detail["ctrlKey"] as? Bool, false)
            XCTAssertEqual(detail["shiftKey"] as? Bool, false)
            XCTAssertEqual(detail["altKey"] as? Bool, false)
            XCTAssertEqual(detail["metaKey"] as? Bool, false)
        }
    }

    // MARK: - mouseup

    func testMouseUp() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.click()
        assertEventSnapshot(named: "testMouseUp")
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
        XCTAssertEqual(events.last?["type"] as? String, "mouseup")
        for event in events.dropFirst().dropLast() {
            XCTAssertEqual(event["type"] as? String, "mousemove")
        }

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

        app.typeKey(.return, modifierFlags: [])
        app.typeKey(.tab, modifierFlags: [])
        app.typeKey(.delete, modifierFlags: [])
        app.typeKey(.escape, modifierFlags: [])
        app.typeKey(.leftArrow, modifierFlags: [])
        app.typeKey(.rightArrow, modifierFlags: [])
        app.typeKey(.upArrow, modifierFlags: [])
        app.typeKey(.downArrow, modifierFlags: [])
        app.typeKey(.home, modifierFlags: [])
        app.typeKey(.end, modifierFlags: [])
        app.typeKey(.pageUp, modifierFlags: [])
        app.typeKey(.pageDown, modifierFlags: [])
        app.typeKey(.forwardDelete, modifierFlags: [])
        app.typeKey(.F1, modifierFlags: [])
        app.typeKey(.F2, modifierFlags: [])
        app.typeKey(.F3, modifierFlags: [])
        app.typeKey(.F4, modifierFlags: [])
        app.typeKey(.F5, modifierFlags: [])
        app.typeKey(.F6, modifierFlags: [])
        app.typeKey(.F7, modifierFlags: [])
        app.typeKey(.F8, modifierFlags: [])
        app.typeKey(.F9, modifierFlags: [])
        app.typeKey(.F10, modifierFlags: [])
        app.typeKey(.F11, modifierFlags: [])
        app.typeKey(.F12, modifierFlags: [])

        assertEventSnapshot(named: "testAllKeys")
    }

    // MARK: - wheel

    func testWheelScrollVertical() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.scroll(byDeltaX: 0, deltaY: 3)
        assertEventSnapshot(named: "testWheelScrollVertical")
    }

    func testWheelScrollHorizontal() {
        let window = app.windows.firstMatch
        let center = window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        settleAt(center)
        center.scroll(byDeltaX: 3, deltaY: 0)
        assertEventSnapshot(named: "testWheelScrollHorizontal")
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
