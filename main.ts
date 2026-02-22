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

import { Black, White } from "./capi/Color.ts";
import { FontCollection } from "./capi/FontCollection.ts";
import { FontMgr } from "./capi/FontMgr.ts";
import { GrDirectContext } from "./capi/GrDirectContext.ts";
import { ParagraphBuilder } from "./capi/ParagraphBuilder.ts";
import { ParagraphStyle } from "./capi/ParagraphStyle.ts";
import { Surface } from "./capi/Surface.ts";
import { TextStyle } from "./capi/TextStyle.ts";

import { Application, Window } from "./window/Window.ts";

const eventLogs: string[] = [];

function log(msg: string): void {
  console.log(msg);
  eventLogs.push(msg);
  if (eventLogs.length > 8) {
    eventLogs.shift();
  }
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
const grCtx = GrDirectContext.MakeMetal(app.metalDevice, app.metalQueue);

const fontMgr = FontMgr.RefDefault();
const fontCollection = FontCollection.Make();
fontCollection.setDefaultFontManager(fontMgr);

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
  const surface = Surface.MakeFromBackendRenderTarget(
    grCtx,
    width,
    height,
    texture,
  );
  if (!surface) return;

  const canvas = surface.getCanvas();
  canvas.clear(Black);

  const ts = new TextStyle({
    color: White,
    fontSize: 24.0 * scale,
    fontFamilies: ["Helvetica Neue"],
  });
  const ps = new ParagraphStyle({ textStyle: ts });
  const builder = ParagraphBuilder.Make(ps, fontCollection);
  builder.pushStyle(ts);

  const text = eventLogs.length > 0 ? eventLogs.join("\n") : "(no events yet)";
  builder.addText(text);

  const para = builder.build();
  para.layout(width);
  canvas.drawParagraph(para, 24.0 * scale, (height - para.getHeight()) * 0.5);

  grCtx.flush();

  builder.delete();
  ps.delete();
  ts.delete();
  surface.delete();
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

await app.run();

fontCollection.delete();
grCtx.releaseResourcesAndAbandonContext();
grCtx.delete();
win.destroy();
