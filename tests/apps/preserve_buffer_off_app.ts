/**
 * tests/apps/preserve_buffer_off_app.ts — preserveDrawingBuffer=false test.
 *
 * Same drawing logic as preserve_buffer_on_app.ts but without
 * preserveDrawingBuffer. After click, only the blue rect should be visible
 * (the red rect from pre-click frames is lost because each Metal drawable
 * is a different texture).
 */

import { Blue, Red, White } from "../../capi/Color.ts";
import { GrDirectContext } from "../../capi/GrDirectContext.ts";
import { Paint } from "../../capi/Paint.ts";
import { Surface } from "../../capi/Surface.ts";
import { Application, Window } from "../../window/Window.ts";

const app = Application.shared;
const grCtx = GrDirectContext.MakeMetal(app.metalDevice, app.metalQueue);

const win = new Window(400, 300, "Preserve Off");

let clicked = false;

win.addEventListener("mousedown", () => {
  clicked = true;
});

win.addEventListener("close", () => {
  app.quit();
});

win.addEventListener("render", (e) => {
  const { texture, width, height } = e.detail;
  const surface = Surface.MakeFromBackendRenderTarget(grCtx, width, height, texture);
  if (!surface) return;
  const canvas = surface.getCanvas();

  if (!clicked) {
    canvas.clear(White);
    const paint = new Paint();
    paint.setColor(Red);
    canvas.drawRect(new Float32Array([20, 50, 170, 200]), paint);
    paint.delete();
  } else {
    const paint = new Paint();
    paint.setColor(Blue);
    canvas.drawRect(new Float32Array([230, 50, 380, 200]), paint);
    paint.delete();
  }

  grCtx.flush();
  surface.delete();
});

win.show();
app.setAppearance("light");
app.run();

grCtx.releaseResourcesAndAbandonContext();
grCtx.delete();
win.destroy();
