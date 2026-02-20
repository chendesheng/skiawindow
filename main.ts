/**
 * main.ts — Deno entry point.
 *
 * Creates an NSWindow (via FFI -> libskiawindow.dylib), pumps native events,
 * polls queued window/input/frame events, and renders with explicit
 * begin-frame/end-frame calls.
 *
 * Build the dylib first:
 *   swift build -c release
 *
 * Run:
 *   deno run --allow-ffi --allow-read --unstable-ffi main.ts
 */

import {
  type Event,
  lib,
  pollEvent,
  pointerArrayBuffer,
  toCString,
} from "./binding.ts";

const eventLogs: string[] = [];

function onRender(
  canvasPtr: Deno.PointerValue,
  width: number,
  height: number,
  scale: number,
): void {
  const { symbols } = lib;

  // Clear to dark background (Catppuccin Mocha base: #1E1E2E)
  symbols.sk_canvas_clear(canvasPtr, 0xff1e1e2e);

  // ---- Font collection ----
  const fontCollection = symbols.sk_font_collection_new();
  const fontMgr = symbols.sk_fontmgr_ref_default();
  symbols.sk_font_collection_set_default_font_manager(fontCollection, fontMgr);

  // ---- Text style ----
  const textStyle = symbols.sk_text_style_create();
  symbols.sk_text_style_set_color(textStyle, 0xffcdd6f4); // Catppuccin text
  symbols.sk_text_style_set_font_size(textStyle, 24.0 * scale);

  const familyNameStr = toCString("Helvetica Neue");
  const familyNamePtr = symbols.sk_string_new(
    familyNameStr,
    BigInt(familyNameStr.length - 1),
  );
  const familiesArray = pointerArrayBuffer([familyNamePtr]);
  symbols.sk_text_style_set_font_families(textStyle, familiesArray, 1n);

  // ---- Paragraph style ----
  const paraStyle = symbols.sk_paragraph_style_new();
  symbols.sk_paragraph_style_set_text_style(paraStyle, textStyle);

  // ---- Build paragraph with event log ----
  const builder = symbols.sk_paragraph_builder_new(paraStyle, fontCollection);
  symbols.sk_paragraph_builder_push_style(builder, textStyle);

  const text = eventLogs.length > 0 ? eventLogs.join("\n") : "(no events yet)";
  const textBytes = toCString(text);
  symbols.sk_paragraph_builder_add_text(
    builder,
    textBytes,
    BigInt(textBytes.length - 1),
  );

  const paragraph = symbols.sk_paragraph_builder_build(builder);

  // ---- Layout and paint ----
  symbols.sk_paragraph_layout(paragraph, width);
  const paraHeight = symbols.sk_paragraph_get_height(paragraph);
  const y = (height - paraHeight) * 0.5;

  symbols.sk_paragraph_paint(paragraph, canvasPtr, 24.0 * scale, y);

  // ---- Cleanup ----
  symbols.sk_paragraph_builder_delete(builder);
  symbols.sk_paragraph_style_delete(paraStyle);
  symbols.sk_string_delete(familyNamePtr);
  symbols.sk_font_collection_unref(fontCollection);
}

function formatMods(event: Event): string {
  const { ctrlKey, shiftKey, altKey, metaKey } = event.mods;
  return `{ctrlKey:${ctrlKey},shiftKey:${shiftKey},altKey:${altKey},metaKey:${metaKey}}`;
}

function formatEvent(event: Event): string {
  switch (event.type) {
    case "mouseDown":
    case "mouseUp":
    case "mouseMove":
      return `${event.type} x=${event.x} y=${event.y} button=${event.button} mods=${formatMods(event)}`;
    case "keyDown":
    case "keyUp":
      return `${event.type} key=${JSON.stringify(event.key)} keyCode=${event.keyCode} isRepeat=${event.isRepeat} mods=${formatMods(event)}`;
    case "windowResize":
      return `${event.type} width=${event.width} height=${event.height} mods=${formatMods(event)}`;
    case "windowFrameReady":
    case "windowClose":
      return `${event.type} mods=${formatMods(event)}`;
  }
}

const titleBuf = toCString("Skia Metal Demo");
const win = lib.symbols.window_create(800, 500, titleBuf);

lib.symbols.window_show(win);

let running = true;

while (running) {
  lib.symbols.window_pump(win);

  let frameReady = false;
  let event: Event | null;
  while ((event = pollEvent(win)) !== null) {
    if (event.type !== "windowFrameReady") {
      const formatted = formatEvent(event);
      console.log(formatted);
      eventLogs.push(formatted);
      if (eventLogs.length > 8) {
        eventLogs.shift();
      }
    }

    if (event.type === "windowClose") {
      running = false;
      break;
    }
    if (event.type === "windowFrameReady") {
      frameReady = true;
      continue;
    }
  }

  if (!running) {
    break;
  }

  if (frameReady) {
    const canvas = lib.symbols.window_begin_frame(win);
    if (canvas) {
      try {
        const width = lib.symbols.window_get_width(win) as number;
        const height = lib.symbols.window_get_height(win) as number;
        const scale = lib.symbols.window_get_scale(win) as number;
        onRender(canvas, width, height, scale);
      } finally {
        lib.symbols.window_end_frame(win);
      }
    }
  }

  // Yield to avoid a hot JS loop while still polling frequently.
  await new Promise((r) => setTimeout(r, 1));
}

lib.symbols.window_destroy(win);
