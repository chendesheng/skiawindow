/*
 * window.swift — Core types and delegates for NSWindow + Metal + Skia.
 *
 * See window_api.swift for the C API (@_cdecl exports).
 * See skia_metal_view.swift for the SkiaMetalView class.
 */

import Cocoa
import Metal
import QuartzCore
import CSkia

let EVENT_TYPE_NONE: Int32             = 0
let EVENT_TYPE_WINDOW_CLOSE: Int32     = 1
let EVENT_TYPE_WINDOW_RESIZE: Int32    = 2
let EVENT_TYPE_WINDOW_FRAME_READY: Int32 = 3
let EVENT_TYPE_MOUSE_DOWN: Int32       = 4
let EVENT_TYPE_MOUSE_UP: Int32         = 5
let EVENT_TYPE_MOUSE_MOVE: Int32       = 6
let EVENT_TYPE_KEY_DOWN: Int32         = 7
let EVENT_TYPE_KEY_UP: Int32           = 8

// MARK: - WindowState

final class WindowState {
    let window:   NSWindow
    let skiaView: SkiaMetalView
    let delegate: WindowDelegate

    private var pendingClose = false
    private var pendingResize = false
    private var pendingFrameReady = false

    init(window: NSWindow, skiaView: SkiaMetalView, delegate: WindowDelegate) {
        self.window   = window
        self.skiaView = skiaView
        self.delegate = delegate
    }

    func markCloseEvent() {
        pendingClose = true
    }

    func markResizeEvent() {
        pendingResize = true
    }

    func markFrameReadyEvent() {
        pendingFrameReady = true
    }

    func pollPendingEvent() -> Int32 {
        if pendingClose {
            pendingClose = false
            return EVENT_TYPE_WINDOW_CLOSE
        }
        if pendingResize {
            pendingResize = false
            return EVENT_TYPE_WINDOW_RESIZE
        }
        if pendingFrameReady {
            pendingFrameReady = false
            return EVENT_TYPE_WINDOW_FRAME_READY
        }
        return EVENT_TYPE_NONE
    }
}

// MARK: - WindowDelegate

final class WindowDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    weak var state: WindowState?

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func windowWillClose(_ notification: Notification) {
        state?.skiaView.stopFrameReadyDisplayLink()
        state?.markCloseEvent()
    }
}

// MARK: - Helpers

func stateFrom(_ ptr: UnsafeMutableRawPointer) -> WindowState {
    Unmanaged<WindowState>.fromOpaque(ptr).takeUnretainedValue()
}
