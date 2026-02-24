import { assertImageSnapshot } from "./helpers/snapshot.ts";
import { Black, White } from "../capi/Color.ts";
import { FontCollection } from "../capi/FontCollection.ts";
import { ParagraphBuilder } from "../capi/ParagraphBuilder.ts";
import { ParagraphStyle } from "../capi/ParagraphStyle.ts";
import { TextStyle } from "../capi/TextStyle.ts";
import { TypefaceFontProvider } from "../capi/TypefaceFontProvider.ts";

Deno.test("draw paragraph", async (t) => {
  const fontData = await Deno.readFile("tests/fixtures/Roboto-Regular.ttf");
  const provider = TypefaceFontProvider.Make();
  provider.registerFont(fontData, "Roboto");
  const fontCollection = FontCollection.Make();
  fontCollection.setDefaultFontManagerPtr(provider.asFontMgr());

  await assertImageSnapshot(t, 300, 100, (canvas) => {
    canvas.clear(White);
    const ts = new TextStyle({
      color: Black,
      fontSize: 24,
      fontFamilies: ["Roboto"],
    });
    const ps = new ParagraphStyle({
      textStyle: {
        color: Black,
        fontSize: 24,
        fontFamilies: ["Roboto"],
      },
    });
    const builder = new ParagraphBuilder(ps, fontCollection);
    builder.pushStyle(ts);
    builder.addText("Hello, Skia!");
    const para = builder.build();
    para.layout(280);
    canvas.drawParagraph(para, 10, 10);
    para.delete();
    builder.delete();
    ps.delete();
    ts.delete();
  });

  fontCollection.delete();
  provider.delete();
});
