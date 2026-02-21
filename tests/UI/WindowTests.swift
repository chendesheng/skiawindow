import XCTest

final class WindowTests: XCTestCase {

    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        let root = "/Users/chendesheng/Sources/cskia"
        app = XCUIApplication()
        app.launchEnvironment["CSKIA_ROOT"] = root
        app.launchArguments = [
            "run", "--allow-ffi", "--allow-read", "--allow-env", "--unstable-ffi",
            root + "/tests/apps/color_app.ts",
        ]
        app.launch()

        let window = app.windows.firstMatch
        XCTAssertTrue(window.waitForExistence(timeout: 10), "Window should appear")
        sleep(1)
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func testInitialRender() {
        let window = app.windows.firstMatch
        let screenshot = window.screenshot().image
        SnapshotHelper.assertSnapshot(screenshot, named: "testInitialRender")
    }

    func testClickChangesBackground() {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        sleep(1)

        let screenshot = window.screenshot().image
        SnapshotHelper.assertSnapshot(screenshot, named: "testClickChangesBackground")
    }

    func testKeyResetsBackground() {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        sleep(1)

        app.typeKey("r", modifierFlags: [])
        sleep(1)

        let screenshot = window.screenshot().image
        SnapshotHelper.assertSnapshot(screenshot, named: "testKeyResetsBackground")
    }
}
