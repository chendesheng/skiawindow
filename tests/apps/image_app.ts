/**
 * tests/apps/image_app.ts — Image loading test using cooperative event loop.
 *
 * Starts with a white background. On mouse click, loads
 * tests/fixtures/icon.png asynchronously via Deno.readFile and draws it
 * centered. This validates that async I/O works during the cooperative
 * run loop.
 */

import { White } from "../../capi/Color.ts";
import { GrDirectContext } from "../../capi/GrDirectContext.ts";
import { Image } from "../../capi/Image.ts";
import { Paint } from "../../capi/Paint.ts";
import { Surface } from "../../capi/Surface.ts";
import { skLib } from "../../capi/binding.ts";
import { Application, Window } from "../../window/Window.ts";

skLib.symbols.register_image_codecs();

const app = Application.shared;
const grCtx = GrDirectContext.MakeMetal(app.metalDevice, app.metalQueue);

const win = new Window(400, 300, "Image App");

let image: Image | null = null;

win.addEventListener("mousedown", async () => {
  if (image) return;
  const data = await Deno.readFile(
    new URL("../fixtures/icon.png", import.meta.url).pathname,
  );
  image = Image.MakeFromEncoded(data);
  if (!image) throw new Error("Failed to decode image");
});

win.addEventListener("close", () => {
  app.quit();
});

win.addEventListener("render", (e) => {
  const { texture, width, height } = e.detail;
  const surface = Surface.MakeFromBackendRenderTarget(grCtx, width, height, texture);
  if (!surface) return;

  const canvas = surface.getCanvas();
  canvas.clear(White);

  if (image) {
    const paint = new Paint();
    paint.setAntiAlias(true);
    const imgW = image.width();
    const imgH = image.height();
    const scale = Math.min((width - 40) / imgW, (height - 40) / imgH);
    const dstW = imgW * scale;
    const dstH = imgH * scale;
    const x = (width - dstW) / 2;
    const y = (height - dstH) / 2;
    const src = new Float32Array([0, 0, imgW, imgH]);
    const dst = new Float32Array([x, y, x + dstW, y + dstH]);
    canvas.drawImageRect(image, src, dst, paint);
    paint.delete();
  }

  grCtx.flush();
  surface.delete();
});

win.show();
app.setAppearance("light");
await app.run();

image?.delete();
grCtx.releaseResourcesAndAbandonContext();
grCtx.delete();
win.destroy();
