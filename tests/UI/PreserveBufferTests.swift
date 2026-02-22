import XCTest

final class PreserveBufferOnTests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = TestHelper.launchApp("preserve_buffer_on_app.ts")
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func testTwoRectsAfterClick() {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        Thread.sleep(forTimeInterval: 0.2)
        let screenshot = window.screenshot().image
        SnapshotHelper.assertImageSnapshot(screenshot, named: "testPreserveBufferOn")
    }
}

final class PreserveBufferOffTests: XCTestCase {
    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = TestHelper.launchApp("preserve_buffer_off_app.ts")
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func testOneRectAfterClick() {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        Thread.sleep(forTimeInterval: 0.2)
        let screenshot = window.screenshot().image
        SnapshotHelper.assertImageSnapshot(screenshot, named: "testPreserveBufferOff")
    }
}
