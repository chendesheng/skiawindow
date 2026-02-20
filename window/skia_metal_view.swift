/*
 * skia_metal_view.swift — Metal-backed NSView with Skia rendering.
 */

import Cocoa
import Metal
import QuartzCore
import CSkia

// MARK: - SkiaMetalView

final class SkiaMetalView: NSView {
    let metalDevice:   MTLDevice
    let commandQueue:  MTLCommandQueue
    let metalLayer:    CAMetalLayer
    let grContext:     OpaquePointer    // gr_direct_context_t *

    unowned var state: WindowState!

    private var link: CADisplayLink?
    private var activeDrawable: CAMetalDrawable?
    private var activeTarget: OpaquePointer?
    private var activeSurface: OpaquePointer?

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

        var backendCtx = gr_mtl_backendcontext_t()
        backendCtx.fDevice = UnsafeRawPointer(Unmanaged.passUnretained(dev as AnyObject).toOpaque())
        backendCtx.fQueue  = UnsafeRawPointer(Unmanaged.passUnretained(queue as AnyObject).toOpaque())
        guard let grCtx = gr_direct_context_make_metal(&backendCtx) else {
            fatalError("Failed to create Skia/Metal GrDirectContext")
        }

        metalDevice  = dev
        commandQueue = queue
        metalLayer   = layer
        grContext    = grCtx

        super.init(frame: frame)

        wantsLayer  = true
        self.layer  = metalLayer
    }

    required init?(coder: NSCoder) { nil }

    deinit {
        link?.invalidate()
        cleanupActiveFrame()
        gr_direct_context_release_resources_and_abandon_context(grContext)
        gr_direct_context_delete(grContext)
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

    private func cleanupActiveFrame() {
        if let surface = activeSurface {
            sk_surface_unref(surface)
            activeSurface = nil
        }
        if let target = activeTarget {
            gr_backendrendertarget_delete(target)
            activeTarget = nil
        }
        activeDrawable = nil
    }

    func beginFrame() -> OpaquePointer? {
        if activeSurface != nil || activeTarget != nil || activeDrawable != nil {
            return nil
        }

        let drawableSize = metalLayer.drawableSize
        let w = Int32(drawableSize.width)
        let h = Int32(drawableSize.height)
        guard w > 0, h > 0 else { return nil }

        guard let drawable = metalLayer.nextDrawable() else { return nil }
        activeDrawable = drawable

        var texInfo = gr_mtl_textureinfo_t()
        texInfo.fTexture = UnsafeRawPointer(Unmanaged.passUnretained(drawable.texture as AnyObject).toOpaque())

        guard let target = gr_backendrendertarget_new_metal(w, h, &texInfo) else {
            activeDrawable = nil
            return nil
        }
        activeTarget = target

        guard let surface = sk_surface_new_backend_render_target(
            grContext, target,
            GR_SURFACE_ORIGIN_TOP_LEFT,
            SK_COLOR_TYPE_BGRA_8888,
            nil, nil
        ) else {
            cleanupActiveFrame()
            NSLog("Failed to create Skia surface")
            return nil
        }
        activeSurface = surface

        return sk_surface_get_canvas(surface)
    }

    func endFrame() {
        guard let drawable = activeDrawable else {
            cleanupActiveFrame()
            return
        }
        guard activeSurface != nil && activeTarget != nil else {
            cleanupActiveFrame()
            return
        }

        defer {
            cleanupActiveFrame()
        }

        gr_direct_context_flush_and_submit(grContext, false)

        if let cmd = commandQueue.makeCommandBuffer() {
            cmd.present(drawable)
            cmd.commit()
        }
    }
}
