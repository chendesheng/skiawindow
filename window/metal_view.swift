/*
 * metal_view.swift — MTKView subclass for Metal rendering + input events.
 */

import Cocoa
import MetalKit

// MARK: - MetalView

final class MetalView: MTKView, MTKViewDelegate {

    unowned var state: WindowState!

    init(frame: NSRect, device: MTLDevice) {
        super.init(frame: frame, device: device)
        isPaused = true
        enableSetNeedsDisplay = true
        delegate = self
    }

    required init(coder: NSCoder) { fatalError() }

    // MARK: Rendering

    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
        setNeedsDisplay(bounds) 
    }

    func draw(in view: MTKView) {
        let sz = drawableSize
        let scale = window?.backingScaleFactor ?? 1.0
        state.onRender?(Int32(sz.width), Int32(sz.height), Double(scale))
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
        state.onMouseDown?(mods, button, x, y, Int32(event.clickCount), UInt32(NSEvent.pressedMouseButtons))
    }

    private func fireMouseUp(_ event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onMouseUp?(mods, button, x, y, Int32(event.clickCount), UInt32(NSEvent.pressedMouseButtons))
    }

    private func fireMouseMove(_ event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onMouseMove?(mods, button, x, y, 0, UInt32(NSEvent.pressedMouseButtons))
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

    // MARK: Scroll wheel

    override func scrollWheel(with event: NSEvent) {
        let (mods, button, x, y) = mouseParams(event)
        state.onWheel?(mods, button, x, y, -event.scrollingDeltaX, -event.scrollingDeltaY)
    }

    // MARK: Cursor

    override func cursorUpdate(with event: NSEvent) {
        state.cursor.set()
    }

    // MARK: Tracking area (required for mouseMoved events)

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        trackingAreas.forEach { removeTrackingArea($0) }
        addTrackingArea(NSTrackingArea(
            rect: bounds,
            options: [.mouseMoved, .activeInKeyWindow, .inVisibleRect, .cursorUpdate],
            owner: self,
            userInfo: nil
        ))
    }

    // MARK: Resize

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        if window != nil { state.onWindowResize?(Int32(bounds.width), Int32(bounds.height)) }
    }
}
