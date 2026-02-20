/*
 * metal_view.swift — Metal-backed NSView (no Skia dependency).
 */

import Cocoa
import Metal
import QuartzCore

// MARK: - MetalView

final class MetalView: NSView {
    let metalDevice:   MTLDevice
    let commandQueue:  MTLCommandQueue
    let metalLayer:    CAMetalLayer

    unowned var state: WindowState!

    private var link: CADisplayLink?
    private var activeDrawable: CAMetalDrawable?

    override init(frame: NSRect) {
        guard let dev = MTLCreateSystemDefaultDevice() else {
            fatalError("Metal is not supported on this device")
        }
        guard let queue = dev.makeCommandQueue() else {
            fatalError("Failed to create Metal command queue")
        }

        let layer = CAMetalLayer()
        layer.device        = dev
        layer.pixelFormat   = .bgra8Unorm
        layer.framebufferOnly = false
        layer.isOpaque      = true

        metalDevice  = dev
        commandQueue = queue
        metalLayer   = layer

        super.init(frame: frame)

        wantsLayer  = true
        self.layer  = metalLayer
    }

    required init?(coder: NSCoder) { nil }

    deinit {
        link?.invalidate()
        activeDrawable = nil
    }

    // MARK: Display link

    func startDisplayLink() {
        let dl = self.displayLink(target: self, selector: #selector(displayLinkTick))
        dl.add(to: .main, forMode: .common)
        link = dl
    }

    @objc private func displayLinkTick() {
        state.onRender?()
    }

    func stopDisplayLink() {
        link?.invalidate()
        link = nil
    }

    // MARK: First responder

    override var acceptsFirstResponder: Bool { true }

    // MARK: Key events

    override func keyDown(with event: NSEvent) {
        let mods = modifierBits(from: event.modifierFlags)
        let keyData = keyboardEventData(event)
        state.onKeyDown?(mods, event.keyCode, event.isARepeat ? 1 : 0, keyData.specialKey, keyData.key)
    }

    override func keyUp(with event: NSEvent) {
        let mods = modifierBits(from: event.modifierFlags)
        let keyData = keyboardEventData(event)
        state.onKeyUp?(mods, event.keyCode, event.isARepeat ? 1 : 0, keyData.specialKey, keyData.key)
    }

    // MARK: Mouse events

    private func fireMouseDown(_ event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onMouseDown?(mods, button, x, y)
    }

    private func fireMouseUp(_ event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onMouseUp?(mods, button, x, y)
    }

    private func fireMouseMove(_ event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onMouseMove?(mods, button, x, y)
    }

    private func mouseParams(_ event: NSEvent) -> (UInt32, Int32, Double, Double) {
        let p = convert(event.locationInWindow, from: nil)
        let flippedY = bounds.height - p.y
        return (modifierBits(from: event.modifierFlags), Int32(event.buttonNumber), p.x, flippedY)
    }

    override func mouseDown(with event: NSEvent)      { fireMouseDown(event) }
    override func rightMouseDown(with event: NSEvent)  { fireMouseDown(event) }
    override func otherMouseDown(with event: NSEvent)  { fireMouseDown(event) }

    override func mouseUp(with event: NSEvent)         { fireMouseUp(event) }
    override func rightMouseUp(with event: NSEvent)    { fireMouseUp(event) }
    override func otherMouseUp(with event: NSEvent)    { fireMouseUp(event) }

    override func mouseMoved(with event: NSEvent)         { fireMouseMove(event) }
    override func mouseDragged(with event: NSEvent)       { fireMouseMove(event) }
    override func rightMouseDragged(with event: NSEvent)  { fireMouseMove(event) }
    override func otherMouseDragged(with event: NSEvent)  { fireMouseMove(event) }

    // MARK: Tracking area (required for mouseMoved events)

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        trackingAreas.forEach { removeTrackingArea($0) }
        addTrackingArea(NSTrackingArea(
            rect: bounds,
            options: [.mouseMoved, .activeInKeyWindow, .inVisibleRect],
            owner: self,
            userInfo: nil
        ))
    }

    // MARK: Drawable size

    private func updateDrawableSize() {
        let scale = window?.backingScaleFactor ?? 1.0
        let sz    = bounds.size
        metalLayer.contentsScale = scale
        metalLayer.drawableSize  = CGSize(width: sz.width * scale, height: sz.height * scale)
    }

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        updateDrawableSize()
        if window != nil { state.onWindowResize?(drawableWidth, drawableHeight) }
    }

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        if window != nil { updateDrawableSize() }
    }

    // MARK: Rendering

    var drawableWidth: Int32 {
        Int32(metalLayer.drawableSize.width)
    }

    var drawableHeight: Int32 {
        Int32(metalLayer.drawableSize.height)
    }

    /// Returns the Metal texture pointer from the next drawable, or nil.
    func beginFrame() -> UnsafeMutableRawPointer? {
        guard activeDrawable == nil else { return nil }

        let drawableSize = metalLayer.drawableSize
        let w = Int32(drawableSize.width)
        let h = Int32(drawableSize.height)
        guard w > 0, h > 0 else { return nil }

        guard let drawable = metalLayer.nextDrawable() else { return nil }
        activeDrawable = drawable

        return Unmanaged.passUnretained(drawable.texture as AnyObject).toOpaque()
    }

    /// Presents the active drawable and releases it.
    func endFrame() {
        guard let drawable = activeDrawable else { return }
        defer { activeDrawable = nil }

        if let cmd = commandQueue.makeCommandBuffer() {
            cmd.present(drawable)
            cmd.commit()
        }
    }
}
