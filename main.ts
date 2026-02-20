/**
 * main.ts — Deno entry point.
 *
 * Creates an NSWindow (via FFI -> libWindow.dylib), sets up a Skia GPU
 * context (via FFI -> libCSkia.dylib), registers event callbacks, and
 * enters NSApp.run() which drives the native event loop.
 *
 * Build the dylibs first:
 *   swift build -c release
 *
 * Run:
 *   deno run --allow-ffi --allow-read --unstable-ffi main.ts
 */

import {
  skLib,
  createGrContext,
  createBackendRenderTarget,
  GR_SURFACE_ORIGIN_TOP_LEFT,
  SK_COLOR_TYPE_BGRA_8888,
  skStringNew,
  paragraphBuilderAddText,
  pointerArrayBuffer,
} from "./capi/binding.ts";

import {
  winLib,
  createWindow,
  type Modifiers,
  setOnMouseDown,
  setOnMouseUp,
  setOnMouseMove,
  setOnKeyDown,
  setOnKeyUp,
  setOnWindowClose,
  setOnWindowResize,
  setOnRender,
  windowRun,
} from "./window/binding.ts";

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
  const sk = skLib.symbols;

  sk.sk_canvas_clear(canvasPtr, 0xff1e1e2e);

  const fontCollection = sk.sk_font_collection_new();
  const fontMgr = sk.sk_fontmgr_ref_default();
  sk.sk_font_collection_set_default_font_manager(fontCollection, fontMgr);

  const textStyle = sk.sk_text_style_create();
  sk.sk_text_style_set_color(textStyle, 0xffcdd6f4);
  sk.sk_text_style_set_font_size(textStyle, 24.0 * scale);

  const familyNamePtr = skStringNew("Helvetica Neue");
  const familiesArray = pointerArrayBuffer([familyNamePtr]);
  sk.sk_text_style_set_font_families(textStyle, familiesArray, 1n);

  const paraStyle = sk.sk_paragraph_style_new();
  sk.sk_paragraph_style_set_text_style(paraStyle, textStyle);

  const builder = sk.sk_paragraph_builder_new(paraStyle, fontCollection);
  sk.sk_paragraph_builder_push_style(builder, textStyle);

  const text = eventLogs.length > 0 ? eventLogs.join("\n") : "(no events yet)";
  paragraphBuilderAddText(builder, text);

  const paragraph = sk.sk_paragraph_builder_build(builder);

  sk.sk_paragraph_layout(paragraph, width);
  const paraHeight = sk.sk_paragraph_get_height(paragraph);
  const y = (height - paraHeight) * 0.5;

  sk.sk_paragraph_paint(paragraph, canvasPtr, 24.0 * scale, y);

  sk.sk_paragraph_builder_delete(builder);
  sk.sk_paragraph_style_delete(paraStyle);
  sk.sk_string_delete(familyNamePtr);
  sk.sk_font_collection_unref(fontCollection);
}

function formatMods(mods: Modifiers): string {
  const { ctrlKey, shiftKey, altKey, metaKey } = mods;
  return `{ctrlKey:${ctrlKey},shiftKey:${shiftKey},altKey:${altKey},metaKey:${metaKey}}`;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const win = createWindow(800, 500, "Skia Metal Demo");
winLib.symbols.window_show(win);

const device = winLib.symbols.window_get_metal_device(win);
const queue = winLib.symbols.window_get_metal_queue(win);
const grContext = createGrContext(device, queue);

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

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
  const texture = winLib.symbols.window_begin_frame(win);
  if (texture) {
    try {
      const w = winLib.symbols.window_get_width(win) as number;
      const h = winLib.symbols.window_get_height(win) as number;
      const scale = winLib.symbols.window_get_scale(win) as number;

      const target = createBackendRenderTarget(w, h, texture);
      const surface = skLib.symbols.sk_surface_new_backend_render_target(
        grContext,
        target,
        GR_SURFACE_ORIGIN_TOP_LEFT,
        SK_COLOR_TYPE_BGRA_8888,
        null,
        null,
      );
      if (surface) {
        const canvas = skLib.symbols.sk_surface_get_canvas(surface);
        onRender(canvas, w, h, scale);
        skLib.symbols.gr_direct_context_flush_and_submit(grContext, false);
        skLib.symbols.sk_surface_unref(surface);
      }
      skLib.symbols.gr_backendrendertarget_delete(target);
    } finally {
      winLib.symbols.window_end_frame(win);
    }
  }
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

windowRun(win);

skLib.symbols.gr_direct_context_release_resources_and_abandon_context(grContext);
skLib.symbols.gr_direct_context_delete(grContext);
winLib.symbols.window_destroy(win);
