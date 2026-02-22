import XCTest

final class ImageTests: XCTestCase {

    var app: XCUIApplication!

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = TestHelper.launchApp("image_app.ts")
    }

    override func tearDown() {
        app.terminate()
        super.tearDown()
    }

    func testImageLoaded() {
        let window = app.windows.firstMatch
        window.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).click()
        Thread.sleep(forTimeInterval: 0.5)
        let screenshot = window.screenshot().image
        SnapshotHelper.assertImageSnapshot(screenshot, named: "testImageLoaded")
    }
}
