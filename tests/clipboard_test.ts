import { assertEquals } from "jsr:@std/assert";
import { clipboardReadText, clipboardWriteText } from "../window/binding.ts";

let saved: string;

Deno.test.beforeEach(async () => {
  saved = await clipboardReadText();
});

Deno.test.afterEach(async () => {
  await clipboardWriteText(saved);
});

Deno.test("clipboard: small text round-trip", async () => {
  const text = "hello clipboard 🎉";
  await clipboardWriteText(text);
  assertEquals(await clipboardReadText(), text);

  await clipboardWriteText("");
  assertEquals(await clipboardReadText(), "");
});

Deno.test("clipboard: large text round-trip (>4KB)", async () => {
  const text = "x".repeat(8192);
  await clipboardWriteText(text);
  assertEquals(await clipboardReadText(), text);
});
