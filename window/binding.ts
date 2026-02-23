/**
 * window/binding.ts — Deno FFI bindings for libWindow.dylib (Metal + AppKit).
 */

import { dirname, fromFileUrl, join } from "jsr:@std/path@^1";

const libDir = join(
  dirname(fromFileUrl(import.meta.url)),
  "..",
  ".build",
  "release",
);
const libPath = join(libDir, "libWindow.dylib");

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

// ---------------------------------------------------------------------------
// FFI symbol definitions
// ---------------------------------------------------------------------------

export const winLib = Deno.dlopen(libPath, {
  // --- Application lifecycle ---

  app_run: {
    parameters: [],
    result: "void",
  },
  app_poll_events: {
    parameters: ["f64"],
    result: "i32",
  },
  app_quit: {
    parameters: [],
    result: "void",
  },
  app_set_appearance: {
    parameters: ["i32"],
    result: "void",
  },
  app_get_metal_device: {
    parameters: [],
    result: "pointer",
  },
  app_get_metal_queue: {
    parameters: [],
    result: "pointer",
  },
  app_open_link: {
    parameters: ["buffer", "usize"],
    result: "void",
  },
  app_clipboard_write_text: {
    parameters: ["buffer", "usize"],
    result: "void",
    nonblocking: true,
  },
  app_clipboard_read_text: {
    parameters: ["buffer", "usize"],
    result: "usize",
    nonblocking: true,
  },

  // --- Window lifecycle ---

  window_create: {
    parameters: ["i32", "i32", "buffer", "usize"],
    result: "pointer",
  },
  window_show: {
    parameters: ["pointer"],
    result: "void",
  },
  window_run: {
    parameters: ["pointer"],
    result: "void",
  },
  window_destroy: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Event callback setters ---

  window_set_on_mouse_down: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_mouse_up: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_mouse_move: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_key_down: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_key_up: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_window_close: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_window_resize: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_render: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_wheel: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_window_focus: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  window_set_on_window_blur: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },

  // --- Frame ---

  window_set_preserve_drawing_buffer: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  window_get_next_drawable_texture: {
    parameters: ["pointer"],
    result: "pointer",
  },
  window_present_drawable: {
    parameters: ["pointer"],
    result: "void",
  },
  window_get_scale: {
    parameters: ["pointer"],
    result: "f64",
  },

  // --- Window property setters ---

  window_set_title: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
  },
  window_set_width: {
    parameters: ["pointer", "i32"],
    result: "void",
  },
  window_set_height: {
    parameters: ["pointer", "i32"],
    result: "void",
  },
  window_set_close_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  window_set_miniaturize_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  window_set_zoom_button_visible: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  window_set_resizable: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  window_set_cursor: {
    parameters: ["pointer", "i32"],
    result: "void",
  },

  // --- Window property getters ---

  window_get_title: {
    parameters: ["pointer", "buffer", "usize"],
    result: "usize",
  },
  window_get_width: {
    parameters: ["pointer"],
    result: "i32",
  },
  window_get_height: {
    parameters: ["pointer"],
    result: "i32",
  },
  window_get_close_button_visible: {
    parameters: ["pointer"],
    result: "bool",
  },
  window_get_miniaturize_button_visible: {
    parameters: ["pointer"],
    result: "bool",
  },
  window_get_zoom_button_visible: {
    parameters: ["pointer"],
    result: "bool",
  },
  window_get_resizable: {
    parameters: ["pointer"],
    result: "bool",
  },
  window_get_cursor: {
    parameters: ["pointer"],
    result: "i32",
  },
});

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

const MOD_CTRL = 1 << 0;
const MOD_SHIFT = 1 << 1;
const MOD_ALT = 1 << 2;
const MOD_META = 1 << 3;

export type Modifiers = {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export enum SpecialKey {
  Text = 1,
  Dead = 2,
  Unidentified = 3,
  Enter = 10,
  Tab = 11,
  Backspace = 12,
  Escape = 13,
  CapsLock = 14,
  Shift = 15,
  Control = 16,
  Alt = 17,
  Meta = 18,
  ArrowLeft = 19,
  ArrowRight = 20,
  ArrowUp = 21,
  ArrowDown = 22,
  Home = 23,
  End = 24,
  PageUp = 25,
  PageDown = 26,
  Delete = 27,
  F1 = 28,
  F2 = 29,
  F3 = 30,
  F4 = 31,
  F5 = 32,
  F6 = 33,
  F7 = 34,
  F8 = 35,
  F9 = 36,
  F10 = 37,
  F11 = 38,
  F12 = 39,
}

function decodeModifiers(modBits: number): Modifiers {
  return {
    ctrlKey: (modBits & MOD_CTRL) !== 0,
    shiftKey: (modBits & MOD_SHIFT) !== 0,
    altKey: (modBits & MOD_ALT) !== 0,
    metaKey: (modBits & MOD_META) !== 0,
  };
}

function decodeCodePoint(codePoint: number): string {
  if (codePoint === 0) return "";
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return "";
  }
}

function keyFromSpecialKey(specialKey: number, keyCodePoint: number): string {
  switch (specialKey as SpecialKey) {
    case SpecialKey.Text: {
      const key = decodeCodePoint(keyCodePoint);
      return key.length > 0 ? key : "Unidentified";
    }
    case SpecialKey.Dead:
      return "Dead";
    case SpecialKey.Unidentified:
      return "Unidentified";
    case SpecialKey.Enter:
      return "Enter";
    case SpecialKey.Tab:
      return "Tab";
    case SpecialKey.Backspace:
      return "Backspace";
    case SpecialKey.Escape:
      return "Escape";
    case SpecialKey.CapsLock:
      return "CapsLock";
    case SpecialKey.Shift:
      return "Shift";
    case SpecialKey.Control:
      return "Control";
    case SpecialKey.Alt:
      return "Alt";
    case SpecialKey.Meta:
      return "Meta";
    case SpecialKey.ArrowLeft:
      return "ArrowLeft";
    case SpecialKey.ArrowRight:
      return "ArrowRight";
    case SpecialKey.ArrowUp:
      return "ArrowUp";
    case SpecialKey.ArrowDown:
      return "ArrowDown";
    case SpecialKey.Home:
      return "Home";
    case SpecialKey.End:
      return "End";
    case SpecialKey.PageUp:
      return "PageUp";
    case SpecialKey.PageDown:
      return "PageDown";
    case SpecialKey.Delete:
      return "Delete";
    case SpecialKey.F1:
      return "F1";
    case SpecialKey.F2:
      return "F2";
    case SpecialKey.F3:
      return "F3";
    case SpecialKey.F4:
      return "F4";
    case SpecialKey.F5:
      return "F5";
    case SpecialKey.F6:
      return "F6";
    case SpecialKey.F7:
      return "F7";
    case SpecialKey.F8:
      return "F8";
    case SpecialKey.F9:
      return "F9";
    case SpecialKey.F10:
      return "F10";
    case SpecialKey.F11:
      return "F11";
    case SpecialKey.F12:
      return "F12";
    default:
      return "Unidentified";
  }
}

// ---------------------------------------------------------------------------
// Callback-based event registration
// ---------------------------------------------------------------------------

export type MouseHandler = (
  mods: Modifiers,
  button: number,
  x: number,
  y: number,
  clickCount: number,
  buttons: number,
) => void;

export type KeyHandler = (
  mods: Modifiers,
  keyCode: number,
  isRepeat: boolean,
  key: string,
) => void;

export type WheelHandler = (
  mods: Modifiers,
  button: number,
  x: number,
  y: number,
  deltaX: number,
  deltaY: number,
) => void;

const MOUSE_CB_DEF = {
  parameters: ["u32", "i32", "f64", "f64", "i32", "u32"],
  result: "void",
} as const;

const KEY_CB_DEF = {
  parameters: ["u32", "u16", "u8", "i32", "u32"],
  result: "void",
} as const;

const VOID_CB_DEF = {
  parameters: [],
  result: "void",
} as const;

const RESIZE_CB_DEF = {
  parameters: ["i32", "i32"],
  result: "void",
} as const;

const RENDER_CB_DEF = {
  parameters: ["i32", "i32", "f64"],
  result: "void",
} as const;

const WHEEL_CB_DEF = {
  parameters: ["u32", "i32", "f64", "f64", "f64", "f64"],
  result: "void",
} as const;

type MouseCb = Deno.UnsafeCallback<typeof MOUSE_CB_DEF>;
type WheelCb = Deno.UnsafeCallback<typeof WHEEL_CB_DEF>;
type KeyCb = Deno.UnsafeCallback<typeof KEY_CB_DEF>;
type VoidCb = Deno.UnsafeCallback<typeof VOID_CB_DEF>;
type ResizeCb = Deno.UnsafeCallback<typeof RESIZE_CB_DEF>;
type RenderCb = Deno.UnsafeCallback<typeof RENDER_CB_DEF>;

function makeMouseCb(handler: MouseHandler): MouseCb {
  return new Deno.UnsafeCallback(
    MOUSE_CB_DEF,
    (
      modBits: number,
      button: number,
      x: number,
      y: number,
      clickCount: number,
      buttons: number,
    ) => {
      handler(decodeModifiers(modBits), button, x, y, clickCount, buttons);
    },
  );
}

export function setOnMouseDown(
  win: Deno.PointerValue,
  handler: MouseHandler,
): MouseCb {
  const cb = makeMouseCb(handler);
  winLib.symbols.window_set_on_mouse_down(win, cb.pointer);
  return cb;
}

export function setOnMouseUp(
  win: Deno.PointerValue,
  handler: MouseHandler,
): MouseCb {
  const cb = makeMouseCb(handler);
  winLib.symbols.window_set_on_mouse_up(win, cb.pointer);
  return cb;
}

export function setOnMouseMove(
  win: Deno.PointerValue,
  handler: MouseHandler,
): MouseCb {
  const cb = makeMouseCb(handler);
  winLib.symbols.window_set_on_mouse_move(win, cb.pointer);
  return cb;
}

function makeKeyCb(handler: KeyHandler): KeyCb {
  return new Deno.UnsafeCallback(
    KEY_CB_DEF,
    (
      modBits: number,
      keyCode: number,
      isRepeat: number,
      specialKey: number,
      keyCP: number,
    ) => {
      handler(
        decodeModifiers(modBits),
        keyCode,
        isRepeat !== 0,
        keyFromSpecialKey(specialKey, keyCP),
      );
    },
  );
}

export function setOnKeyDown(
  win: Deno.PointerValue,
  handler: KeyHandler,
): KeyCb {
  const cb = makeKeyCb(handler);
  winLib.symbols.window_set_on_key_down(win, cb.pointer);
  return cb;
}

export function setOnKeyUp(
  win: Deno.PointerValue,
  handler: KeyHandler,
): KeyCb {
  const cb = makeKeyCb(handler);
  winLib.symbols.window_set_on_key_up(win, cb.pointer);
  return cb;
}

export function setOnWindowClose(
  win: Deno.PointerValue,
  handler: () => void,
): VoidCb {
  const cb = new Deno.UnsafeCallback(VOID_CB_DEF, handler);
  winLib.symbols.window_set_on_window_close(win, cb.pointer);
  return cb;
}

export function setOnWindowResize(
  win: Deno.PointerValue,
  handler: (width: number, height: number) => void,
): ResizeCb {
  const cb = new Deno.UnsafeCallback(RESIZE_CB_DEF, handler);
  winLib.symbols.window_set_on_window_resize(win, cb.pointer);
  return cb;
}

export function setOnRender(
  win: Deno.PointerValue,
  handler: (
    drawableWidth: number,
    drawableHeight: number,
    scale: number,
  ) => void,
): RenderCb {
  const cb = new Deno.UnsafeCallback(RENDER_CB_DEF, handler);
  winLib.symbols.window_set_on_render(win, cb.pointer);
  return cb;
}

export function setOnWheel(
  win: Deno.PointerValue,
  handler: WheelHandler,
): WheelCb {
  const cb = new Deno.UnsafeCallback(
    WHEEL_CB_DEF,
    (
      modBits: number,
      button: number,
      x: number,
      y: number,
      deltaX: number,
      deltaY: number,
    ) => {
      handler(decodeModifiers(modBits), button, x, y, deltaX, deltaY);
    },
  );
  winLib.symbols.window_set_on_wheel(win, cb.pointer);
  return cb;
}

export function setOnWindowFocus(
  win: Deno.PointerValue,
  handler: () => void,
): VoidCb {
  const cb = new Deno.UnsafeCallback(VOID_CB_DEF, handler);
  winLib.symbols.window_set_on_window_focus(win, cb.pointer);
  return cb;
}

export function setOnWindowBlur(
  win: Deno.PointerValue,
  handler: () => void,
): VoidCb {
  const cb = new Deno.UnsafeCallback(VOID_CB_DEF, handler);
  winLib.symbols.window_set_on_window_blur(win, cb.pointer);
  return cb;
}

export function windowRun(win: Deno.PointerValue): void {
  winLib.symbols.window_run(win);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asFfiBuffer(view: ArrayBufferView): Uint8Array<ArrayBuffer> {
  if (view.buffer instanceof ArrayBuffer) {
    return new Uint8Array(
      view.buffer,
      view.byteOffset,
      view.byteLength,
    ) as Uint8Array<ArrayBuffer>;
  }
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const out = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  out.set(bytes);
  return out;
}

function encodeUtf8(s: string): Uint8Array<ArrayBuffer> {
  const encoded = utf8Encoder.encode(s);
  return asFfiBuffer(encoded);
}

function decodeUtf8(bytes: Uint8Array): string {
  return utf8Decoder.decode(bytes);
}

export function getWindowTitle(win: Deno.PointerValue): string {
  const initial = new Uint8Array(256);
  const totalLen = Number(winLib.symbols.window_get_title(win, initial, 256n));
  if (totalLen <= initial.length) {
    return decodeUtf8(initial.subarray(0, totalLen));
  }
  const exact = new Uint8Array(totalLen);
  winLib.symbols.window_get_title(win, exact, BigInt(exact.length));
  return decodeUtf8(exact);
}

export function createWindow(
  width: number,
  height: number,
  title: string,
): Deno.PointerValue {
  const titleBytes = encodeUtf8(title);
  return winLib.symbols.window_create(
    width,
    height,
    titleBytes,
    BigInt(titleBytes.length),
  );
}

export function setWindowTitle(win: Deno.PointerValue, title: string): void {
  const titleBytes = encodeUtf8(title);
  winLib.symbols.window_set_title(win, titleBytes, BigInt(titleBytes.length));
}

export function openLink(href: string): void {
  const hrefBytes = encodeUtf8(href);
  winLib.symbols.app_open_link(hrefBytes, BigInt(hrefBytes.length));
}

export async function clipboardWriteText(text: string): Promise<void> {
  const textBytes = encodeUtf8(text);
  await winLib.symbols.app_clipboard_write_text(
    textBytes,
    BigInt(textBytes.length),
  );
}

export async function clipboardReadText(): Promise<string> {
  const initial = new Uint8Array(4096);
  const totalLen = Number(
    await winLib.symbols.app_clipboard_read_text(initial, 4096n),
  );
  if (totalLen <= initial.length) {
    return decodeUtf8(initial.subarray(0, totalLen));
  }
  const exact = new Uint8Array(totalLen);
  await winLib.symbols.app_clipboard_read_text(exact, BigInt(exact.length));
  return decodeUtf8(exact);
}
