import { assertAlmostEquals, assertEquals } from "jsr:@std/assert";
import { Black, color4fToColor, createColor4f } from "../capi/Color.ts";
import { FontCollection } from "../capi/FontCollection.ts";
import { ParagraphBuilder } from "../capi/ParagraphBuilder.ts";
import { ParagraphStyle } from "../capi/ParagraphStyle.ts";
import { TextStyle } from "../capi/TextStyle.ts";
import { TypefaceFontProvider } from "../capi/TypefaceFontProvider.ts";

Deno.test("TextStyle constructor and property wrappers", () => {
  const style = new TextStyle({
    color: Black,
    fontSize: 18,
    fontFamilies: ["Roboto", "SF Pro Text"],
    heightMultiplier: 1.25,
    halfLeading: true,
    letterSpacing: 1.5,
    wordSpacing: 2.5,
    locale: "en-US",
    textBaseline: 1,
    fontStyle: { weight: 500, width: 6, slant: 1 },
    decoration: 1,
    decorationStyle: 2,
    decorationColor: createColor4f(1, 0, 0, 1),
    decorationThickness: 1.75,
  });

  assertEquals(color4fToColor(style.color), color4fToColor(Black));
  assertAlmostEquals(style.fontSize, 18, 1e-5);
  assertEquals(style.fontFamilies, ["Roboto", "SF Pro Text"]);
  assertAlmostEquals(style.heightMultiplier ?? 0, 1.25, 1e-5);
  assertEquals(style.halfLeading, true);
  assertAlmostEquals(style.letterSpacing, 1.5, 1e-5);
  assertAlmostEquals(style.wordSpacing, 2.5, 1e-5);
  assertEquals(style.locale, "en-US");
  assertEquals(style.textBaseline, 1);
  assertEquals(style.fontStyle.weight, 500);
  assertEquals(style.fontStyle.width, 6);
  assertEquals(style.fontStyle.slant, 1);
  assertEquals(style.decoration, 1);
  assertEquals(style.decorationStyle, 2);
  assertEquals(color4fToColor(style.decorationColor), 0xffff0000);
  assertAlmostEquals(style.decorationThickness, 1.75, 1e-5);

  style.fontSize = 22;
  style.color = createColor4f(0, 1, 0, 1);
  style.heightMultiplier = 1.1;
  style.delete();
});

Deno.test("ParagraphStyle constructor and property wrappers", () => {
  const style = new ParagraphStyle({
    textStyle: { color: Black, fontSize: 14 },
    textAlign: 2,
    textDirection: 1,
    maxLines: 3,
    ellipsis: "...",
    heightMultiplier: 1.3,
  });

  assertEquals(style.textAlign, 2);
  assertEquals(style.textDirection, 1);
  assertEquals(style.maxLines, 3);
  assertEquals(style.ellipsis, "...");
  assertAlmostEquals(style.heightMultiplier, 1.3, 1e-5);

  const copiedTextStyle = style.textStyle;
  assertAlmostEquals(copiedTextStyle.fontSize, 14, 1e-5);
  copiedTextStyle.delete();

  style.maxLines = 5;
  assertEquals(style.maxLines, 5);

  style.delete();
});

Deno.test("ParagraphBuilder.pushStyle accepts TextStyleOptions", async () => {
  const fontData = await Deno.readFile("tests/fixtures/Roboto-Regular.ttf");
  const provider = TypefaceFontProvider.Make();
  provider.registerFont(fontData, "Roboto");
  const fontCollection = FontCollection.Make();
  fontCollection.setDefaultFontManagerPtr(provider.asFontMgr());

  const paragraphStyle = new ParagraphStyle({
    textStyle: { color: Black, fontSize: 12, fontFamilies: ["Roboto"] },
  });
  const builder = new ParagraphBuilder(paragraphStyle, fontCollection);
  builder.pushStyle({ color: Black, fontSize: 16, fontFamilies: ["Roboto"] });
  builder.addText("Hello");
  builder.pop();

  const paragraph = builder.build();
  paragraph.layout(200);
  assertEquals(paragraph.getHeight() > 0, true);

  paragraph.delete();
  builder.delete();
  paragraphStyle.delete();
  fontCollection.delete();
  provider.delete();
});
