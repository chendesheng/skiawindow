/*
 * window.swift — Core types and delegates for NSWindow + Metal + Skia.
 *
 * See window_api.swift for the C API (@_cdecl exports).
 * See skia_metal_view.swift for the SkiaMetalView class.
 */

import Cocoa
import Metal
import QuartzCore

// MARK: - Callback typedefs

public typealias MouseCallback    = @convention(c) (UInt32, Int32, Double, Double) -> Void
public typealias KeyCallback      = @convention(c) (UInt32, UInt16, UInt8, Int32, UInt32) -> Void
public typealias VoidCallback     = @convention(c) () -> Void
public typealias ResizeCallback   = @convention(c) (Int32, Int32) -> Void

// MARK: - WindowState

final class WindowState {
    let window:   NSWindow
    let skiaView: SkiaMetalView
    let delegate: WindowDelegate

    var onMouseDown: MouseCallback?
    var onMouseUp: MouseCallback?
    var onMouseMove: MouseCallback?
    var onKeyDown: KeyCallback?
    var onKeyUp: KeyCallback?
    var onWindowClose: VoidCallback?
    var onWindowResize: ResizeCallback?
    var onRender: VoidCallback?

    init(window: NSWindow, skiaView: SkiaMetalView, delegate: WindowDelegate) {
        self.window   = window
        self.skiaView = skiaView
        self.delegate = delegate
    }
}

// MARK: - WindowDelegate

final class WindowDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    weak var state: WindowState?

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func windowWillClose(_ notification: Notification) {
        state?.skiaView.stopDisplayLink()
        state?.onWindowClose?()

        NSApp.stop(nil)
        // NSApp.stop only takes effect after the current event finishes;
        // post a dummy event to wake the run loop so NSApp.run() returns.
        let event = NSEvent.otherEvent(
            with: .applicationDefined,
            location: .zero,
            modifierFlags: [],
            timestamp: 0,
            windowNumber: 0,
            context: nil,
            subtype: 0,
            data1: 0,
            data2: 0
        )
        if let event { NSApp.postEvent(event, atStart: false) }
    }
}

// MARK: - Helpers

func stateFrom(_ ptr: UnsafeMutableRawPointer) -> WindowState {
    Unmanaged<WindowState>.fromOpaque(ptr).takeUnretainedValue()
}
