/**
 * tests/apps/color_app.ts — Simple test fixture app.
 *
 * Draws a white background with a centered blue rectangle.
 * Clicking changes the background to red.
 * Pressing "r" resets the background to white.
 */

import { Blue, Red, White } from "../../capi/Color.ts";
import { GrDirectContext } from "../../capi/GrDirectContext.ts";
import { Paint } from "../../capi/Paint.ts";
import { Surface } from "../../capi/Surface.ts";
import { Application, Window } from "../../window/Window.ts";

const app = Application.shared;
const grCtx = GrDirectContext.MakeMetal(app.metalDevice, app.metalQueue);

const win = new Window(400, 300, "Color App");

let bgColor = White;

win.addEventListener("mousedown", () => {
  bgColor = Red;
});

win.addEventListener("keydown", (e) => {
  if (e.detail.key === "r") {
    bgColor = White;
  }
});

win.addEventListener("close", () => {
  app.quit();
});

win.addEventListener("render", (e) => {
  const { texture, width, height } = e.detail;
  const surface = Surface.MakeFromBackendRenderTarget(grCtx, width, height, texture);
  if (!surface) return;

  const canvas = surface.getCanvas();
  canvas.clear(bgColor);

  const paint = new Paint();
  paint.setColor(Blue);
  const rectSize = 100;
  const x = (width - rectSize) / 2;
  const y = (height - rectSize) / 2;
  canvas.drawRect(new Float32Array([x, y, x + rectSize, y + rectSize]), paint);
  paint.delete();

  grCtx.flush();
  surface.delete();
});

win.show();
app.setAppearance("light");
app.run();

grCtx.releaseResourcesAndAbandonContext();
grCtx.delete();
win.destroy();
