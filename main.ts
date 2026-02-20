/**
 * main.ts — Deno entry point.
 *
 * Creates an NSWindow (via FFI -> libskiawindow.dylib), registers event
 * callbacks, and enters NSApp.run() which drives the native event loop.
 *
 * Build the dylib first:
 *   swift build -c release
 *
 * Run:
 *   deno run --allow-ffi --allow-read --unstable-ffi main.ts
 */

import {
  createWindow,
  type Modifiers,
  lib,
  paragraphBuilderAddText,
  pointerArrayBuffer,
  skStringNew,
  setOnMouseDown,
  setOnMouseUp,
  setOnMouseMove,
  setOnKeyDown,
  setOnKeyUp,
  setOnWindowClose,
  setOnWindowResize,
  setOnRender,
  windowRun,
} from "./binding.ts";

const eventLogs: string[] = [];

function log(msg: string): void {
  console.log(msg);
  eventLogs.push(msg);
  if (eventLogs.length > 8) {
    eventLogs.shift();
  }
}

function onRender(
  canvasPtr: Deno.PointerValue,
  width: number,
  height: number,
  scale: number,
): void {
  const { symbols } = lib;

  symbols.sk_canvas_clear(canvasPtr, 0xff1e1e2e);

  const fontCollection = symbols.sk_font_collection_new();
  const fontMgr = symbols.sk_fontmgr_ref_default();
  symbols.sk_font_collection_set_default_font_manager(fontCollection, fontMgr);

  const textStyle = symbols.sk_text_style_create();
  symbols.sk_text_style_set_color(textStyle, 0xffcdd6f4);
  symbols.sk_text_style_set_font_size(textStyle, 24.0 * scale);

  const familyNamePtr = skStringNew("Helvetica Neue");
  const familiesArray = pointerArrayBuffer([familyNamePtr]);
  symbols.sk_text_style_set_font_families(textStyle, familiesArray, 1n);

  const paraStyle = symbols.sk_paragraph_style_new();
  symbols.sk_paragraph_style_set_text_style(paraStyle, textStyle);

  const builder = symbols.sk_paragraph_builder_new(paraStyle, fontCollection);
  symbols.sk_paragraph_builder_push_style(builder, textStyle);

  const text = eventLogs.length > 0 ? eventLogs.join("\n") : "(no events yet)";
  paragraphBuilderAddText(builder, text);

  const paragraph = symbols.sk_paragraph_builder_build(builder);

  symbols.sk_paragraph_layout(paragraph, width);
  const paraHeight = symbols.sk_paragraph_get_height(paragraph);
  const y = (height - paraHeight) * 0.5;

  symbols.sk_paragraph_paint(paragraph, canvasPtr, 24.0 * scale, y);

  symbols.sk_paragraph_builder_delete(builder);
  symbols.sk_paragraph_style_delete(paraStyle);
  symbols.sk_string_delete(familyNamePtr);
  symbols.sk_font_collection_unref(fontCollection);
}

function formatMods(mods: Modifiers): string {
  const { ctrlKey, shiftKey, altKey, metaKey } = mods;
  return `{ctrlKey:${ctrlKey},shiftKey:${shiftKey},altKey:${altKey},metaKey:${metaKey}}`;
}

const win = createWindow(800, 500, "Skia Metal Demo");
lib.symbols.window_show(win);

setOnMouseDown(win, (mods, button, x, y) => {
  log(`mouseDown x=${x} y=${y} button=${button} mods=${formatMods(mods)}`);
});

setOnMouseUp(win, (mods, button, x, y) => {
  log(`mouseUp x=${x} y=${y} button=${button} mods=${formatMods(mods)}`);
});

setOnMouseMove(win, (mods, button, x, y) => {
  log(`mouseMove x=${x} y=${y} button=${button} mods=${formatMods(mods)}`);
});

setOnKeyDown(win, (mods, keyCode, isRepeat, key) => {
  log(
    `keyDown key=${JSON.stringify(key)} keyCode=${keyCode} isRepeat=${isRepeat} mods=${formatMods(mods)}`,
  );
});

setOnKeyUp(win, (mods, keyCode, isRepeat, key) => {
  log(
    `keyUp key=${JSON.stringify(key)} keyCode=${keyCode} isRepeat=${isRepeat} mods=${formatMods(mods)}`,
  );
});

setOnWindowClose(win, () => {
  log("windowClose");
});

setOnWindowResize(win, (width, height) => {
  log(`windowResize width=${width} height=${height}`);
});

setOnRender(win, () => {
  const canvas = lib.symbols.window_begin_frame(win);
  if (canvas) {
    try {
      const w = lib.symbols.window_get_width(win) as number;
      const h = lib.symbols.window_get_height(win) as number;
      const scale = lib.symbols.window_get_scale(win) as number;
      onRender(canvas, w, h, scale);
    } finally {
      lib.symbols.window_end_frame(win);
    }
  }
});

windowRun(win);

lib.symbols.window_destroy(win);
