/*
 * window_api.swift — C API exports (@_cdecl) for the window module.
 *
 * Exposes:
 *   app_run / app_quit / app_get_metal_device / app_get_metal_queue
 *   window_create / window_show / window_run / window_destroy
 *   window_set_on_mouse_down / window_set_on_mouse_up / window_set_on_mouse_move
 *   window_set_on_key_down / window_set_on_key_up
 *   window_set_on_window_close / window_set_on_window_resize / window_set_on_render
 *   window_get_next_drawable / drawable_get_texture / present_drawable
 *   window_get_scale
 *   window_set_title / window_set_width / window_set_height
 *   window_set_close_button_visible / window_set_miniaturize_button_visible / window_set_zoom_button_visible
 *   window_set_resizable
 *   window_get_title / window_get_width / window_get_height
 *   window_get_close_button_visible / window_get_miniaturize_button_visible / window_get_zoom_button_visible
 *   window_get_resizable
 */

import Cocoa
import Metal
import QuartzCore
import Carbon.HIToolbox

// MARK: - Constants

private let MOD_CTRL: UInt32  = 1 << 0
private let MOD_SHIFT: UInt32 = 1 << 1
private let MOD_ALT: UInt32   = 1 << 2
private let MOD_META: UInt32  = 1 << 3

private let KEY_KIND_NONE: Int32 = 0
private let KEY_KIND_TEXT: Int32 = 1
private let KEY_KIND_DEAD: Int32 = 2
private let KEY_KIND_UNIDENTIFIED: Int32 = 3
private let KEY_KIND_ENTER: Int32 = 10
private let KEY_KIND_TAB: Int32 = 11
private let KEY_KIND_BACKSPACE: Int32 = 12
private let KEY_KIND_ESCAPE: Int32 = 13
private let KEY_KIND_CAPS_LOCK: Int32 = 14
private let KEY_KIND_SHIFT: Int32 = 15
private let KEY_KIND_CONTROL: Int32 = 16
private let KEY_KIND_ALT: Int32 = 17
private let KEY_KIND_META: Int32 = 18
private let KEY_KIND_ARROW_LEFT: Int32 = 19
private let KEY_KIND_ARROW_RIGHT: Int32 = 20
private let KEY_KIND_ARROW_UP: Int32 = 21
private let KEY_KIND_ARROW_DOWN: Int32 = 22
private let KEY_KIND_HOME: Int32 = 23
private let KEY_KIND_END: Int32 = 24
private let KEY_KIND_PAGE_UP: Int32 = 25
private let KEY_KIND_PAGE_DOWN: Int32 = 26
private let KEY_KIND_DELETE: Int32 = 27
private let KEY_KIND_F1: Int32 = 28
private let KEY_KIND_F2: Int32 = 29
private let KEY_KIND_F3: Int32 = 30
private let KEY_KIND_F4: Int32 = 31
private let KEY_KIND_F5: Int32 = 32
private let KEY_KIND_F6: Int32 = 33
private let KEY_KIND_F7: Int32 = 34
private let KEY_KIND_F8: Int32 = 35
private let KEY_KIND_F9: Int32 = 36
private let KEY_KIND_F10: Int32 = 37
private let KEY_KIND_F11: Int32 = 38
private let KEY_KIND_F12: Int32 = 39

// MARK: - Event data helpers (module-internal, used by MetalView)

func modifierBits(from flags: NSEvent.ModifierFlags) -> UInt32 {
    var bits: UInt32 = 0
    if flags.contains(.control) { bits |= MOD_CTRL }
    if flags.contains(.shift) { bits |= MOD_SHIFT }
    if flags.contains(.option) { bits |= MOD_ALT }
    if flags.contains(.command) { bits |= MOD_META }
    return bits
}

private func isDeadKeyString(_ value: String) -> Bool {
    guard !value.isEmpty else { return false }
    return value.unicodeScalars.allSatisfy { scalar in
        let category = scalar.properties.generalCategory
        return category == .nonspacingMark || category == .spacingMark || category == .enclosingMark
    }
}

private func specialKeyKind(for keyCode: UInt16) -> Int32? {
    switch Int(keyCode) {
    case kVK_Return, kVK_ANSI_KeypadEnter:
        return KEY_KIND_ENTER
    case kVK_Tab:
        return KEY_KIND_TAB
    case kVK_Delete:
        return KEY_KIND_BACKSPACE
    case kVK_Escape:
        return KEY_KIND_ESCAPE
    case kVK_CapsLock:
        return KEY_KIND_CAPS_LOCK
    case kVK_Shift, kVK_RightShift:
        return KEY_KIND_SHIFT
    case kVK_Control, kVK_RightControl:
        return KEY_KIND_CONTROL
    case kVK_Option, kVK_RightOption:
        return KEY_KIND_ALT
    case kVK_Command, kVK_RightCommand:
        return KEY_KIND_META
    case kVK_LeftArrow:
        return KEY_KIND_ARROW_LEFT
    case kVK_RightArrow:
        return KEY_KIND_ARROW_RIGHT
    case kVK_UpArrow:
        return KEY_KIND_ARROW_UP
    case kVK_DownArrow:
        return KEY_KIND_ARROW_DOWN
    case kVK_Home:
        return KEY_KIND_HOME
    case kVK_End:
        return KEY_KIND_END
    case kVK_PageUp:
        return KEY_KIND_PAGE_UP
    case kVK_PageDown:
        return KEY_KIND_PAGE_DOWN
    case kVK_ForwardDelete:
        return KEY_KIND_DELETE
    case kVK_F1:
        return KEY_KIND_F1
    case kVK_F2:
        return KEY_KIND_F2
    case kVK_F3:
        return KEY_KIND_F3
    case kVK_F4:
        return KEY_KIND_F4
    case kVK_F5:
        return KEY_KIND_F5
    case kVK_F6:
        return KEY_KIND_F6
    case kVK_F7:
        return KEY_KIND_F7
    case kVK_F8:
        return KEY_KIND_F8
    case kVK_F9:
        return KEY_KIND_F9
    case kVK_F10:
        return KEY_KIND_F10
    case kVK_F11:
        return KEY_KIND_F11
    case kVK_F12:
        return KEY_KIND_F12
    default:
        return nil
    }
}

func keyboardEventData(_ event: NSEvent) -> (specialKey: Int32, key: UInt32) {
    if let special = specialKeyKind(for: event.keyCode) {
        return (special, 0)
    }
    if let chars = event.characters, !chars.isEmpty {
        if isDeadKeyString(chars) {
            return (KEY_KIND_DEAD, 0)
        }
        if let firstScalar = chars.unicodeScalars.first {
            return (KEY_KIND_TEXT, firstScalar.value)
        }
    }
    return (KEY_KIND_UNIDENTIFIED, 0)
}

private func decodeUtf8(_ bytes: UnsafePointer<UInt8>?, _ length: Int) -> String? {
    guard let bytes, length >= 0 else { return nil }
    let buffer = UnsafeBufferPointer(start: bytes, count: length)
    return String(decoding: buffer, as: UTF8.self)
}

// MARK: - Application lifecycle

@_cdecl("app_run")
public func appRun() {
    NSApp.run()
}

@_cdecl("app_quit")
public func appQuit() {
    NSApp.stop(nil)
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

@_cdecl("app_get_metal_device")
public func appGetMetalDevice() -> UnsafeMutableRawPointer? {
    let dev = AppState.shared.metalDevice as AnyObject
    return Unmanaged.passUnretained(dev).toOpaque()
}

@_cdecl("app_get_metal_queue")
public func appGetMetalQueue() -> UnsafeMutableRawPointer? {
    let queue = AppState.shared.commandQueue as AnyObject
    return Unmanaged.passUnretained(queue).toOpaque()
}

// MARK: - Window lifecycle

@_cdecl("window_create")
public func windowCreate(
    _ width:  Int32,
    _ height: Int32,
    _ title: UnsafePointer<UInt8>?,
    _ titleLen: Int
) -> UnsafeMutableRawPointer {
    let titleStr = decodeUtf8(title, titleLen) ?? "Untitled"
    let appState = AppState.shared

    let frame = NSRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height))

    let nsWin = NSWindow(
        contentRect: frame,
        styleMask:   [.titled, .closable, .resizable, .miniaturizable],
        backing:     .buffered,
        defer:       false
    )
    nsWin.title = titleStr
    nsWin.center()

    let view = MetalView(frame: frame, device: appState.metalDevice)
    nsWin.contentView = view

    let state = WindowState(window: nsWin, metalView: view)
    view.state = state

    return Unmanaged.passRetained(state).toOpaque()
}

@_cdecl("window_show")
public func windowShow(_ win: UnsafeMutableRawPointer?) {
    guard let win else { return }
    let s = stateFrom(win)
    s.window.makeKeyAndOrderFront(nil)
    s.window.makeFirstResponder(s.metalView)
    NSApp.activate(ignoringOtherApps: true)
    s.metalView.startDisplayLink()
}

@_cdecl("window_run")
public func windowRun(_ win: UnsafeMutableRawPointer?) {
    guard win != nil else { return }
    NSApp.run()
}

@_cdecl("window_destroy")
public func windowDestroy(_ win: UnsafeMutableRawPointer?) {
    guard let win else { return }
    Unmanaged<WindowState>.fromOpaque(win).release()
}

// MARK: - Event callback setters

@_cdecl("window_set_on_mouse_down")
public func windowSetOnMouseDown(_ win: UnsafeMutableRawPointer?, _ cb: MouseCallback?) {
    guard let win else { return }
    stateFrom(win).onMouseDown = cb
}

@_cdecl("window_set_on_mouse_up")
public func windowSetOnMouseUp(_ win: UnsafeMutableRawPointer?, _ cb: MouseCallback?) {
    guard let win else { return }
    stateFrom(win).onMouseUp = cb
}

@_cdecl("window_set_on_mouse_move")
public func windowSetOnMouseMove(_ win: UnsafeMutableRawPointer?, _ cb: MouseCallback?) {
    guard let win else { return }
    stateFrom(win).onMouseMove = cb
}

@_cdecl("window_set_on_key_down")
public func windowSetOnKeyDown(_ win: UnsafeMutableRawPointer?, _ cb: KeyCallback?) {
    guard let win else { return }
    stateFrom(win).onKeyDown = cb
}

@_cdecl("window_set_on_key_up")
public func windowSetOnKeyUp(_ win: UnsafeMutableRawPointer?, _ cb: KeyCallback?) {
    guard let win else { return }
    stateFrom(win).onKeyUp = cb
}

@_cdecl("window_set_on_window_close")
public func windowSetOnWindowClose(_ win: UnsafeMutableRawPointer?, _ cb: VoidCallback?) {
    guard let win else { return }
    stateFrom(win).onWindowClose = cb
}

@_cdecl("window_set_on_window_resize")
public func windowSetOnWindowResize(_ win: UnsafeMutableRawPointer?, _ cb: ResizeCallback?) {
    guard let win else { return }
    stateFrom(win).onWindowResize = cb
}

@_cdecl("window_set_on_render")
public func windowSetOnRender(_ win: UnsafeMutableRawPointer?, _ cb: VoidCallback?) {
    guard let win else { return }
    stateFrom(win).onRender = cb
}

// MARK: - Frame

@_cdecl("window_get_next_drawable")
public func windowGetNextDrawable(_ win: UnsafeMutableRawPointer?) -> UnsafeMutableRawPointer? {
    guard let win else { return nil }
    return stateFrom(win).metalView.getNextDrawable()
}

@_cdecl("drawable_get_texture")
public func drawableGetTexture(_ drawablePtr: UnsafeMutableRawPointer?) -> UnsafeMutableRawPointer? {
    guard let drawablePtr else { return nil }
    let drawable = Unmanaged<AnyObject>.fromOpaque(drawablePtr)
        .takeUnretainedValue() as! CAMetalDrawable
    return Unmanaged.passUnretained(drawable.texture as AnyObject).toOpaque()
}

@_cdecl("present_drawable")
public func presentDrawable(_ queuePtr: UnsafeMutableRawPointer?, _ drawablePtr: UnsafeMutableRawPointer?) {
    guard let queuePtr, let drawablePtr else { return }
    let queue = Unmanaged<AnyObject>.fromOpaque(queuePtr)
        .takeUnretainedValue() as! MTLCommandQueue
    let drawable = Unmanaged<AnyObject>.fromOpaque(drawablePtr)
        .takeRetainedValue() as! CAMetalDrawable
    if let cmd = queue.makeCommandBuffer() {
        cmd.present(drawable)
        cmd.commit()
    }
}

@_cdecl("window_get_scale")
public func windowGetScale(_ win: UnsafeMutableRawPointer?) -> Double {
    guard let win else { return 1.0 }
    return stateFrom(win).window.backingScaleFactor
}

// MARK: - Property setters

@_cdecl("window_set_title")
public func windowSetTitle(_ win: UnsafeMutableRawPointer?, _ title: UnsafePointer<UInt8>?, _ titleLen: Int) {
    guard let win, let titleStr = decodeUtf8(title, titleLen) else { return }
    stateFrom(win).window.title = titleStr
}

@_cdecl("window_set_width")
public func windowSetWidth(_ win: UnsafeMutableRawPointer?, _ width: Int32) {
    guard let win else { return }
    let w = stateFrom(win).window
    var frame = w.frame
    frame.size.width = CGFloat(width)
    w.setFrame(frame, display: true)
}

@_cdecl("window_set_height")
public func windowSetHeight(_ win: UnsafeMutableRawPointer?, _ height: Int32) {
    guard let win else { return }
    let w = stateFrom(win).window
    var frame = w.frame
    frame.size.height = CGFloat(height)
    w.setFrame(frame, display: true)
}

@_cdecl("window_set_close_button_visible")
public func windowSetCloseButtonVisible(_ win: UnsafeMutableRawPointer?, _ visible: Bool) {
    guard let win else { return }
    stateFrom(win).window.standardWindowButton(.closeButton)?.isHidden = !visible
}

@_cdecl("window_set_miniaturize_button_visible")
public func windowSetMiniaturizeButtonVisible(_ win: UnsafeMutableRawPointer?, _ visible: Bool) {
    guard let win else { return }
    stateFrom(win).window.standardWindowButton(.miniaturizeButton)?.isHidden = !visible
}

@_cdecl("window_set_zoom_button_visible")
public func windowSetZoomButtonVisible(_ win: UnsafeMutableRawPointer?, _ visible: Bool) {
    guard let win else { return }
    stateFrom(win).window.standardWindowButton(.zoomButton)?.isHidden = !visible
}

@_cdecl("window_set_resizable")
public func windowSetResizable(_ win: UnsafeMutableRawPointer?, _ resizable: Bool) {
    guard let win else { return }
    let w = stateFrom(win).window
    if resizable {
        w.styleMask.insert(.resizable)
    } else {
        w.styleMask.remove(.resizable)
    }
}

// MARK: - Property getters

@_cdecl("window_get_title")
public func windowGetTitle(_ win: UnsafeMutableRawPointer?, _ buf: UnsafeMutablePointer<UInt8>?, _ bufLen: Int) -> Int {
    guard let win else { return 0 }
    let bytes = Array(stateFrom(win).window.title.utf8)
    guard let buf, bufLen > 0 else { return bytes.count }

    let toCopy = min(bytes.count, bufLen)
    for i in 0..<toCopy {
        buf[i] = bytes[i]
    }
    return bytes.count
}

@_cdecl("window_get_width")
public func windowGetWidth(_ win: UnsafeMutableRawPointer?) -> Int32 {
    guard let win else { return 0 }
    return stateFrom(win).metalView.drawableWidth
}

@_cdecl("window_get_height")
public func windowGetHeight(_ win: UnsafeMutableRawPointer?) -> Int32 {
    guard let win else { return 0 }
    return stateFrom(win).metalView.drawableHeight
}

@_cdecl("window_get_close_button_visible")
public func windowGetCloseButtonVisible(_ win: UnsafeMutableRawPointer?) -> Bool {
    guard let win else { return false }
    return !(stateFrom(win).window.standardWindowButton(.closeButton)?.isHidden ?? true)
}

@_cdecl("window_get_miniaturize_button_visible")
public func windowGetMiniaturizeButtonVisible(_ win: UnsafeMutableRawPointer?) -> Bool {
    guard let win else { return false }
    return !(stateFrom(win).window.standardWindowButton(.miniaturizeButton)?.isHidden ?? true)
}

@_cdecl("window_get_zoom_button_visible")
public func windowGetZoomButtonVisible(_ win: UnsafeMutableRawPointer?) -> Bool {
    guard let win else { return false }
    return !(stateFrom(win).window.standardWindowButton(.zoomButton)?.isHidden ?? true)
}

@_cdecl("window_get_resizable")
public func windowGetResizable(_ win: UnsafeMutableRawPointer?) -> Bool {
    guard let win else { return false }
    return stateFrom(win).window.styleMask.contains(.resizable)
}
