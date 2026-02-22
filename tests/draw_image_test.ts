import { assertImageSnapshot } from "./helpers/snapshot.ts";
import { Image } from "../capi/Image.ts";
import { Paint } from "../capi/Paint.ts";
import { White } from "../capi/Color.ts";
import { skLib } from "../capi/binding.ts";

skLib.symbols.register_image_codecs();

Deno.test("draw image from local file", async (t) => {
  const data = await Deno.readFile("tests/fixtures/icon.png");
  const image = Image.MakeFromEncoded(data);
  if (!image) throw new Error("Failed to decode image");

  await assertImageSnapshot(t, 200, 200, (canvas) => {
    canvas.clear(White);
    const paint = new Paint();
    paint.setAntiAlias(true);
    const src = new Float32Array([0, 0, image.width(), image.height()]);
    const dst = new Float32Array([10, 10, 190, 190]);
    canvas.drawImageRect(image, src, dst, paint);
    paint.delete();
  });

  image.delete();
});

Deno.test("draw image from https", async (t) => {
  const resp = await fetch(
    "https://raw.githubusercontent.com/chendesheng/skiawindow/main/tests/fixtures/icon.png",
  );
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
  const data = new Uint8Array(await resp.arrayBuffer());
  const image = Image.MakeFromEncoded(data);
  if (!image) throw new Error("Failed to decode image");

  await assertImageSnapshot(t, 200, 200, (canvas) => {
    canvas.clear(White);
    const paint = new Paint();
    paint.setAntiAlias(true);
    const src = new Float32Array([0, 0, image.width(), image.height()]);
    const dst = new Float32Array([10, 10, 190, 190]);
    canvas.drawImageRect(image, src, dst, paint);
    paint.delete();
  });

  image.delete();
});
