import { assertImageSnapshot } from "./helpers/snapshot.ts";
import { Black, White } from "../capi/Color.ts";
import { Font } from "../capi/Font.ts";
import { FontStyle } from "../capi/FontStyle.ts";
import { Paint } from "../capi/Paint.ts";
import { TypefaceFontProvider } from "../capi/TypefaceFontProvider.ts";
import { skLib } from "../capi/binding.ts";

Deno.test("draw text", async (t) => {
  const fontData = await Deno.readFile("tests/fixtures/Roboto-Regular.ttf");
  const provider = TypefaceFontProvider.Make();
  provider.registerFont(fontData, "Roboto");

  const style = new FontStyle();
  const typeface = provider.matchFamilyStyle("Roboto", style);
  const font = new Font(typeface, 24);
  const paint = new Paint();

  try {
    await assertImageSnapshot(t, 300, 100, (canvas) => {
      canvas.clear(White);
      paint.setColor(Black);
      canvas.drawText("Hello, drawText!", 16, 60, paint, font);
    });
  } finally {
    paint.delete();
    font.delete();
    style.delete();
    skLib.symbols.sk_typeface_unref(typeface);
    provider.delete();
  }
});
