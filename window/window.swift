/*
 * window.swift — Core types and delegates for NSWindow + Metal.
 *
 * See window_api.swift for the C API (@_cdecl exports).
 * See metal_view.swift for the MetalView class.
 */

import Cocoa
import MetalKit

// MARK: - Callback typedefs

public typealias MouseCallback    = @convention(c) (UInt32, Int32, Double, Double, Int32, UInt32) -> Void
public typealias KeyCallback      = @convention(c) (UInt32, UInt16, UInt8, Int32, UInt32) -> Void
public typealias VoidCallback     = @convention(c) () -> Void
public typealias ResizeCallback   = @convention(c) (Int32, Int32) -> Void
public typealias RenderCallback   = @convention(c) (Int32, Int32, Double) -> Void
public typealias WheelCallback    = @convention(c) (UInt32, Int32, Double, Double, Double, Double) -> Void

// MARK: - AppState (singleton — NSApplicationDelegate + shared Metal resources)

final class AppState: NSObject, NSApplicationDelegate {
    static let shared = AppState()

    lazy var metalDevice: MTLDevice = {
        guard let dev = MTLCreateSystemDefaultDevice() else {
            fatalError("Metal is not supported on this device")
        }
        return dev
    }()

    lazy var commandQueue: MTLCommandQueue = {
        guard let queue = metalDevice.makeCommandQueue() else {
            fatalError("Failed to create Metal command queue")
        }
        return queue
    }()

    private override init() {
        super.init()

        let app = NSApplication.shared
        app.setActivationPolicy(.regular)
        app.delegate = self
        app.finishLaunching()
    }
}

// MARK: - WindowState (NSWindowDelegate)

final class WindowState: NSObject, NSWindowDelegate {
    let window:    NSWindow
    let metalView: MetalView

    var onMouseDown: MouseCallback?
    var onMouseUp: MouseCallback?
    var onMouseMove: MouseCallback?
    var onKeyDown: KeyCallback?
    var onKeyUp: KeyCallback?
    var onWheel: WheelCallback?
    var onWindowClose: VoidCallback?
    var onWindowResize: ResizeCallback?
    var onRender: RenderCallback?
    var onWindowFocus: VoidCallback?
    var onWindowBlur: VoidCallback?

    var cursor: NSCursor = .arrow

    var preserveDrawingBuffer: Bool = false
    var offscreenTexture: MTLTexture? = nil
    var currentDrawable: CAMetalDrawable? {
        self.metalView.currentDrawable
    }
    var inLiveResize: Bool { self.metalView.inLiveResize }

    init(window: NSWindow, metalView: MetalView) {
        self.window    = window
        self.metalView = metalView
        super.init()
        window.delegate = self
    }

    func windowWillClose(_ notification: Notification) {
        metalView.isPaused = true
        onWindowClose?()
    }

    func windowDidBecomeKey(_ notification: Notification) {
        onWindowFocus?()
    }

    func windowDidResignKey(_ notification: Notification) {
        onWindowBlur?()
    }
}

// MARK: - Helpers

func stateFrom(_ ptr: UnsafeMutableRawPointer) -> WindowState {
    Unmanaged<WindowState>.fromOpaque(ptr).takeUnretainedValue()
}
