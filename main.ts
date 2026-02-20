/**
 * main.ts — Deno entry point.
 *
 * Creates an NSWindow (via the high-level Window API), sets up a Skia GPU
 * context, registers event callbacks, and enters NSApp.run() which drives
 * the native event loop.
 *
 * Build the dylibs first:
 *   swift build -c release
 *
 * Run:
 *   deno run --allow-ffi --allow-read --unstable-ffi main.ts
 */

import {
  createBackendRenderTarget,
  createGrContext,
  GR_SURFACE_ORIGIN_TOP_LEFT,
  paragraphBuilderAddText,
  pointerArrayBuffer,
  SK_COLOR_TYPE_BGRA_8888,
  skLib,
  skStringNew,
} from "./capi/binding.ts";

import { Application, Window } from "./window/Window.ts";

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

function formatMods(m: {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}): string {
  return `{ctrlKey:${m.ctrlKey},shiftKey:${m.shiftKey},altKey:${m.altKey},metaKey:${m.metaKey}}`;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const app = Application.shared;
const grContext = createGrContext(app.metalDevice, app.metalQueue);

const win = new Window(800, 500, "Skia Metal Demo");
win.show();

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

win.addEventListener("mousedown", (e) => {
  const d = e.detail;
  log(`mouseDown x=${d.x} y=${d.y} button=${d.button} mods=${formatMods(d)}`);
});

win.addEventListener("mouseup", (e) => {
  const d = e.detail;
  log(`mouseUp x=${d.x} y=${d.y} button=${d.button} mods=${formatMods(d)}`);
});

win.addEventListener("mousemove", (e) => {
  const d = e.detail;
  log(`mouseMove x=${d.x} y=${d.y} button=${d.button} mods=${formatMods(d)}`);
});

win.addEventListener("keydown", (e) => {
  const d = e.detail;
  log(
    `keyDown key=${
      JSON.stringify(d.key)
    } keyCode=${d.keyCode} isRepeat=${d.isRepeat} mods=${formatMods(d)}`,
  );
});

win.addEventListener("keyup", (e) => {
  const d = e.detail;
  log(
    `keyUp key=${
      JSON.stringify(d.key)
    } keyCode=${d.keyCode} isRepeat=${d.isRepeat} mods=${formatMods(d)}`,
  );
});

win.addEventListener("close", () => {
  log("windowClose");
  app.quit();
});

win.addEventListener("resize", (e) => {
  const d = e.detail;
  log(`windowResize width=${d.width} height=${d.height}`);
});

win.addEventListener("render", (e) => {
  const { texture, width, height, scale } = e.detail;
  const target = createBackendRenderTarget(width, height, texture);
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
    onRender(canvas, width, height, scale);
    skLib.symbols.gr_direct_context_flush_and_submit(grContext, false);
    skLib.symbols.sk_surface_unref(surface);
  }
  skLib.symbols.gr_backendrendertarget_delete(target);
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

app.run();

skLib.symbols.gr_direct_context_release_resources_and_abandon_context(
  grContext,
);
skLib.symbols.gr_direct_context_delete(grContext);
win.destroy();
