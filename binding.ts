/**
 * binding.ts — Deno FFI bindings for libskiawindow.dylib.
 *
 * The dylib bundles both the NSWindow/Metal window management (window.m) and
 * the Skia C API (sk_capi.cpp + Skia static libs) into a single shared
 * library so Deno only needs one dlopen call.
 */

import { join, dirname, fromFileUrl } from "jsr:@std/path";

const libDir = join(dirname(fromFileUrl(import.meta.url)), ".build", "release");
const libPath = join(libDir, "libSkiaWindow.dylib");

// ---------------------------------------------------------------------------
// FFI symbol definitions
// ---------------------------------------------------------------------------

export const lib = Deno.dlopen(libPath, {
  // --- Window API ---

  /** Create a window. Returns an opaque window_t* handle. */
  window_create: {
    parameters: ["i32", "i32", "buffer"],
    result: "pointer",
    nonblocking: false,
  },

  /** Show and activate the window without entering NSApp.run(). */
  window_show: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  /** Pump pending AppKit events once (non-blocking). */
  window_pump: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  /** Poll one queued event into caller-provided buffer. Returns false when queue is empty. */
  window_poll_event: {
    parameters: ["pointer", "buffer"],
    result: "bool",
    nonblocking: false,
  },

  /** Begin a frame and return sk_canvas_t* (or null if no drawable is available). */
  window_begin_frame: {
    parameters: ["pointer"],
    result: "pointer",
    nonblocking: false,
  },

  /** End the active frame (flush/present). */
  window_end_frame: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  /** Return the backing scale factor for HiDPI-aware layout. */
  window_get_scale: {
    parameters: ["pointer"],
    result: "f64",
    nonblocking: false,
  },

  /** Free the window_t struct. */
  window_destroy: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  // --- Window property setters ---

  window_set_title: {
    parameters: ["pointer", "buffer"],
    result: "void",
    nonblocking: false,
  },

  window_set_width: {
    parameters: ["pointer", "i32"],
    result: "void",
    nonblocking: false,
  },

  window_set_height: {
    parameters: ["pointer", "i32"],
    result: "void",
    nonblocking: false,
  },

  window_set_close_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
    nonblocking: false,
  },

  window_set_miniaturize_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
    nonblocking: false,
  },

  window_set_zoom_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
    nonblocking: false,
  },

  window_set_resizable: {
    parameters: ["pointer", "bool"],
    result: "void",
    nonblocking: false,
  },

  // --- Window property getters ---

  /** Writes null-terminated UTF-8 title into caller-supplied buffer of bufLen bytes. */
  window_get_title: {
    parameters: ["pointer", "buffer", "i32"],
    result: "void",
    nonblocking: false,
  },

  window_get_width: {
    parameters: ["pointer"],
    result: "i32",
    nonblocking: false,
  },

  window_get_height: {
    parameters: ["pointer"],
    result: "i32",
    nonblocking: false,
  },

  window_get_close_button_visible: {
    parameters: ["pointer"],
    result: "bool",
    nonblocking: false,
  },

  window_get_miniaturize_button_visible: {
    parameters: ["pointer"],
    result: "bool",
    nonblocking: false,
  },

  window_get_zoom_button_visible: {
    parameters: ["pointer"],
    result: "bool",
    nonblocking: false,
  },

  window_get_resizable: {
    parameters: ["pointer"],
    result: "bool",
    nonblocking: false,
  },

  // --- Canvas ---

  /** Clear the entire canvas with an ARGB colour (e.g. 0xFFFFFFFF = opaque white). */
  sk_canvas_clear: {
    parameters: ["pointer", "u32"],
    result: "void",
    nonblocking: false,
  },

  // --- Font manager ---

  /** Return a ref to the default system font manager. */
  sk_fontmgr_ref_default: {
    parameters: [],
    result: "pointer",
    nonblocking: false,
  },

  // --- Font collection ---

  sk_font_collection_new: {
    parameters: [],
    result: "pointer",
    nonblocking: false,
  },

  sk_font_collection_set_default_font_manager: {
    parameters: ["pointer", "pointer"],
    result: "void",
    nonblocking: false,
  },

  sk_font_collection_unref: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  // --- sk_string ---

  /** Create an sk_string_t from a UTF-8 buffer and byte length. */
  sk_string_new: {
    parameters: ["buffer", "usize"],
    result: "pointer",
    nonblocking: false,
  },

  sk_string_delete: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  // --- Text style ---

  sk_text_style_create: {
    parameters: [],
    result: "pointer",
    nonblocking: false,
  },

  sk_text_style_set_color: {
    parameters: ["pointer", "u32"],
    result: "void",
    nonblocking: false,
  },

  sk_text_style_set_font_size: {
    parameters: ["pointer", "f32"],
    result: "void",
    nonblocking: false,
  },

  /**
   * Set font families from an array of sk_string_t* pointers.
   * Parameters: (sk_text_style_t*, const sk_string_t**, size_t count)
   */
  sk_text_style_set_font_families: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
    nonblocking: false,
  },

  // --- Paragraph style ---

  sk_paragraph_style_new: {
    parameters: [],
    result: "pointer",
    nonblocking: false,
  },

  sk_paragraph_style_set_text_style: {
    parameters: ["pointer", "pointer"],
    result: "void",
    nonblocking: false,
  },

  sk_paragraph_style_delete: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  // --- Paragraph builder ---

  sk_paragraph_builder_new: {
    parameters: ["pointer", "pointer"],
    result: "pointer",
    nonblocking: false,
  },

  sk_paragraph_builder_push_style: {
    parameters: ["pointer", "pointer"],
    result: "void",
    nonblocking: false,
  },

  sk_paragraph_builder_add_text: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
    nonblocking: false,
  },

  /** Consumes the builder and returns a sk_paragraph_t*. */
  sk_paragraph_builder_build: {
    parameters: ["pointer"],
    result: "pointer",
    nonblocking: false,
  },

  sk_paragraph_builder_delete: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: false,
  },

  // --- Paragraph ---

  sk_paragraph_layout: {
    parameters: ["pointer", "f32"],
    result: "void",
    nonblocking: false,
  },

  sk_paragraph_get_height: {
    parameters: ["pointer"],
    result: "f32",
    nonblocking: false,
  },

  sk_paragraph_paint: {
    parameters: ["pointer", "pointer", "f32", "f32"],
    result: "void",
    nonblocking: false,
  },
});

// ---------------------------------------------------------------------------
// Window events
// ---------------------------------------------------------------------------

const EVENT_TYPE_WINDOW_CLOSE = 1;
const EVENT_TYPE_WINDOW_RESIZE = 2;
const EVENT_TYPE_WINDOW_FRAME_READY = 3;
const EVENT_TYPE_MOUSE_DOWN = 4;
const EVENT_TYPE_MOUSE_UP = 5;
const EVENT_TYPE_MOUSE_MOVE = 6;
const EVENT_TYPE_KEY_DOWN = 7;
const EVENT_TYPE_KEY_UP = 8;

const MOD_CTRL = 1 << 0;
const MOD_SHIFT = 1 << 1;
const MOD_ALT = 1 << 2;
const MOD_META = 1 << 3;

const WINDOW_EVENT_SIZE = 104;
const OFF_TYPE = 0;
const OFF_MOD_BITS = 4;
const OFF_X = 8;
const OFF_Y = 16;
const OFF_BUTTON = 24;
const OFF_KEY_CODE = 28;
const OFF_IS_REPEAT = 30;
const OFF_WIDTH = 32;
const OFF_HEIGHT = 36;
const OFF_KEY = 40;
const KEY_VALUE_MAX_BYTES = 64;

const eventBuffer = new Uint8Array(new ArrayBuffer(WINDOW_EVENT_SIZE));
const eventView = new DataView(eventBuffer.buffer);

export type Modifiers = {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type EventType =
  | "windowClose"
  | "windowResize"
  | "windowFrameReady"
  | "mouseDown"
  | "mouseUp"
  | "mouseMove"
  | "keyDown"
  | "keyUp";

export type Event = {
  type: EventType;
  mods: Modifiers;
  x?: number;
  y?: number;
  button?: number;
  keyCode?: number;
  key?: string;
  isRepeat?: boolean;
  width?: number;
  height?: number;
};

function decodeModifiers(modBits: number): Modifiers {
  return {
    ctrlKey: (modBits & MOD_CTRL) !== 0,
    shiftKey: (modBits & MOD_SHIFT) !== 0,
    altKey: (modBits & MOD_ALT) !== 0,
    metaKey: (modBits & MOD_META) !== 0,
  };
}

function decodeCString(offset: number, maxBytes: number): string {
  const bytes = new Uint8Array(eventBuffer.buffer, offset, maxBytes);
  let end = 0;
  while (end < bytes.length && bytes[end] !== 0) {
    end++;
  }
  return new TextDecoder().decode(bytes.subarray(0, end));
}

export function pollEvent(win: Deno.PointerValue): Event | null {
  const hasEvent = lib.symbols.window_poll_event(win, eventBuffer) as boolean;
  if (!hasEvent) {
    return null;
  }

  const type = eventView.getInt32(OFF_TYPE, true);
  const mods = decodeModifiers(eventView.getUint32(OFF_MOD_BITS, true));

  switch (type) {
    case EVENT_TYPE_WINDOW_CLOSE:
      return { type: "windowClose", mods };
    case EVENT_TYPE_WINDOW_RESIZE:
      return {
        type: "windowResize",
        mods,
        width: eventView.getInt32(OFF_WIDTH, true),
        height: eventView.getInt32(OFF_HEIGHT, true),
      };
    case EVENT_TYPE_WINDOW_FRAME_READY:
      return { type: "windowFrameReady", mods };
    case EVENT_TYPE_MOUSE_DOWN:
      return {
        type: "mouseDown",
        mods,
        x: eventView.getFloat64(OFF_X, true),
        y: eventView.getFloat64(OFF_Y, true),
        button: eventView.getInt32(OFF_BUTTON, true),
      };
    case EVENT_TYPE_MOUSE_UP:
      return {
        type: "mouseUp",
        mods,
        x: eventView.getFloat64(OFF_X, true),
        y: eventView.getFloat64(OFF_Y, true),
        button: eventView.getInt32(OFF_BUTTON, true),
      };
    case EVENT_TYPE_MOUSE_MOVE:
      return {
        type: "mouseMove",
        mods,
        x: eventView.getFloat64(OFF_X, true),
        y: eventView.getFloat64(OFF_Y, true),
        button: eventView.getInt32(OFF_BUTTON, true),
      };
    case EVENT_TYPE_KEY_DOWN:
      return {
        type: "keyDown",
        mods,
        keyCode: eventView.getUint16(OFF_KEY_CODE, true),
        key: decodeCString(OFF_KEY, KEY_VALUE_MAX_BYTES),
        isRepeat: eventView.getUint8(OFF_IS_REPEAT) !== 0,
      };
    case EVENT_TYPE_KEY_UP:
      return {
        type: "keyUp",
        mods,
        keyCode: eventView.getUint16(OFF_KEY_CODE, true),
        key: decodeCString(OFF_KEY, KEY_VALUE_MAX_BYTES),
        isRepeat: eventView.getUint8(OFF_IS_REPEAT) !== 0,
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode a JS string as a null-terminated UTF-8 Uint8Array backed by a plain ArrayBuffer. */
export function toCString(s: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(s);
  const buf = new Uint8Array(new ArrayBuffer(encoded.length + 1));
  buf.set(encoded);
  // last byte is already 0 from ArrayBuffer zero-initialisation
  return buf;
}

/**
 * Build a pointer array (as a Uint8Array<ArrayBuffer>) containing the raw pointer
 * values of the given pointer handles.  Used to pass arrays of sk_string_t*
 * to functions like sk_text_style_set_font_families.
 */
export function pointerArrayBuffer(
  ptrs: Deno.PointerValue[],
): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(8 * ptrs.length);
  const view = new DataView(ab);
  for (let i = 0; i < ptrs.length; i++) {
    const p = Deno.UnsafePointer.value(ptrs[i]);
    view.setBigUint64(i * 8, BigInt(p), true /* little-endian */);
  }
  return new Uint8Array(ab);
}
