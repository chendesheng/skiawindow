import XCTest

enum TestHelper {
    static let projectRoot: String = {
        var url = URL(fileURLWithPath: #filePath)
        for _ in 0..<3 { url.deleteLastPathComponent() }
        return url.path
    }()

    static func launchApp(
        _ script: String,
        extraDenoFlags: [String] = [],
        extraArgs: [String] = []
    ) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments =
            ["run", "--allow-ffi", "--allow-read", "--allow-env", "--unstable-ffi"]
            + extraDenoFlags
            + [projectRoot + "/tests/apps/" + script]
            + extraArgs
        app.launch()
        XCTAssertTrue(app.windows.firstMatch.waitForExistence(timeout: 10))
        return app
    }
}
