import { paragraphBuilderAddText, skLib } from "./binding.ts";
import type { FontCollection } from "./FontCollection.ts";
import { Paragraph } from "./Paragraph.ts";
import type { ParagraphStyle } from "./ParagraphStyle.ts";
import { TextStyle, type TextStyleOptions } from "./TextStyle.ts";

const sk = skLib.symbols;

/** Pack sk_paragraph_placeholder_style_t {f32, f32, i32, i32, f32} = 20 bytes */
function packPlaceholderStyle(
  width: number,
  height: number,
  alignment: number,
  baseline: number,
  baselineOffset: number,
): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(20);
  const dv = new DataView(buf);
  dv.setFloat32(0, width, true);
  dv.setFloat32(4, height, true);
  dv.setInt32(8, alignment, true);
  dv.setInt32(12, baseline, true);
  dv.setFloat32(16, baselineOffset, true);
  return new Uint8Array(buf);
}

export class ParagraphBuilder {
  #ptr: Deno.PointerValue;

  constructor(
    style: ParagraphStyle,
    fontCollection: FontCollection,
  ) {
    this.#ptr = sk.sk_paragraph_builder_new(style._ptr, fontCollection._ptr);
  }

  pushStyle(style: TextStyle | TextStyleOptions): void {
    if (style instanceof TextStyle) {
      sk.sk_paragraph_builder_push_style(this.#ptr, style._ptr);
      return;
    }

    const textStyle = new TextStyle(style);
    try {
      sk.sk_paragraph_builder_push_style(this.#ptr, textStyle._ptr);
    } finally {
      textStyle.delete();
    }
  }

  pop(): void {
    sk.sk_paragraph_builder_pop(this.#ptr);
  }

  addText(text: string): void {
    paragraphBuilderAddText(this.#ptr, text);
  }

  addPlaceholder(
    width: number,
    height: number,
    alignment: number = 0,
    baseline: number = 0,
    baselineOffset: number = 0,
  ): void {
    sk.sk_paragraph_builder_add_placeholder(
      this.#ptr,
      packPlaceholderStyle(width, height, alignment, baseline, baselineOffset),
    );
  }

  build(): Paragraph {
    const ptr = sk.sk_paragraph_builder_build(this.#ptr);
    return new Paragraph(ptr);
  }

  getText(): string {
    // sk_span_t { char* data (8 bytes), size_t size (8 bytes) } = 16 bytes
    const span = sk.sk_paragraph_builder_get_text(this.#ptr) as Uint8Array;
    const dv = new DataView(span.buffer, span.byteOffset, span.byteLength);
    const dataPtr = Deno.UnsafePointer.create(dv.getBigUint64(0, true));
    const len = Number(dv.getBigUint64(8, true));
    if (!dataPtr || len === 0) return "";
    const view = new Deno.UnsafePointerView(dataPtr);
    const bytes = new Uint8Array(len);
    view.copyInto(bytes);
    return new TextDecoder().decode(bytes);
  }

  reset(): void {
    sk.sk_paragraph_builder_reset(this.#ptr);
  }

  delete(): void {
    sk.sk_paragraph_builder_delete(this.#ptr);
  }
}
