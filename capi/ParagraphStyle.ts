import { encodeUtf8, skLib } from "./binding.ts";
import { TextStyle } from "./TextStyle.ts";
import type { TextStyleOptions } from "./TextStyle.ts";

const sk = skLib.symbols;

const PARAGRAPH_STYLE_HAS_TEXT_STYLE = 1n << 0n;
const PARAGRAPH_STYLE_HAS_TEXT_ALIGN = 1n << 1n;
const PARAGRAPH_STYLE_HAS_TEXT_DIRECTION = 1n << 2n;
const PARAGRAPH_STYLE_HAS_MAX_LINES = 1n << 3n;
const PARAGRAPH_STYLE_HAS_ELLIPSIS = 1n << 4n;
const PARAGRAPH_STYLE_HAS_HEIGHT = 1n << 5n;

export interface ParagraphStyleOptions {
  textStyle?: TextStyleOptions;
  textAlign?: number;
  textDirection?: number;
  maxLines?: number;
  ellipsis?: string;
  heightMultiplier?: number;
}

export class ParagraphStyle {
  #ptr: Deno.PointerValue;

  constructor(opts?: ParagraphStyleOptions) {
    const textStyle = opts?.textStyle !== undefined
      ? new TextStyle(opts.textStyle)
      : undefined;
    let flags = 0n;
    if (opts?.textStyle !== undefined) flags |= PARAGRAPH_STYLE_HAS_TEXT_STYLE;
    if (opts?.textAlign !== undefined) flags |= PARAGRAPH_STYLE_HAS_TEXT_ALIGN;
    if (opts?.textDirection !== undefined) {
      flags |= PARAGRAPH_STYLE_HAS_TEXT_DIRECTION;
    }
    if (opts?.maxLines !== undefined) flags |= PARAGRAPH_STYLE_HAS_MAX_LINES;
    if (opts?.ellipsis !== undefined) flags |= PARAGRAPH_STYLE_HAS_ELLIPSIS;
    if (opts?.heightMultiplier !== undefined) flags |= PARAGRAPH_STYLE_HAS_HEIGHT;

    const ellipsisBytes = opts?.ellipsis !== undefined
      ? encodeUtf8(opts.ellipsis)
      : (new Uint8Array(0) as Uint8Array<ArrayBuffer>);
    try {
      this.#ptr = sk.sk_paragraph_style_new_with_options(
        flags,
        opts?.textAlign ?? 0,
        opts?.textDirection ?? 0,
        BigInt(opts?.maxLines ?? 0),
        opts?.heightMultiplier ?? 0,
        ellipsisBytes,
        BigInt(ellipsisBytes.length),
        textStyle?._ptr ?? null,
      );
    } finally {
      textStyle?.delete();
    }
  }

  get _ptr(): Deno.PointerValue {
    return this.#ptr;
  }

  get textStyle(): TextStyle {
    const ptr = sk.sk_paragraph_style_get_text_style_copy(this.#ptr);
    return TextStyle._fromPtr(ptr);
  }

  set textStyle(style: TextStyle | undefined) {
    if (style === undefined) return;
    this.setTextStyle(style);
  }

  setTextStyle(style: TextStyle): void {
    sk.sk_paragraph_style_set_text_style(this.#ptr, style._ptr);
  }

  get textAlign(): number {
    return sk.sk_paragraph_style_get_text_align(this.#ptr) as number;
  }

  set textAlign(align: number | undefined) {
    if (align === undefined) return;
    this.setTextAlign(align);
  }

  setTextAlign(align: number): void {
    sk.sk_paragraph_style_set_text_align(this.#ptr, align);
  }

  get textDirection(): number {
    return sk.sk_paragraph_style_get_text_direction(this.#ptr) as number;
  }

  set textDirection(dir: number | undefined) {
    if (dir === undefined) return;
    this.setTextDirection(dir);
  }

  setTextDirection(dir: number): void {
    sk.sk_paragraph_style_set_text_direction(this.#ptr, dir);
  }

  get maxLines(): number {
    return Number(sk.sk_paragraph_style_get_max_lines(this.#ptr));
  }

  set maxLines(maxLines: number | undefined) {
    if (maxLines === undefined) return;
    this.setMaxLines(maxLines);
  }

  setMaxLines(maxLines: number): void {
    sk.sk_paragraph_style_set_max_lines(this.#ptr, BigInt(maxLines));
  }

  get ellipsis(): string {
    const ptr = sk.sk_paragraph_style_get_ellipsis(this.#ptr);
    if (!ptr) return "";
    return new Deno.UnsafePointerView(ptr).getCString();
  }

  set ellipsis(ellipsis: string | undefined) {
    if (ellipsis === undefined) return;
    this.setEllipsis(ellipsis);
  }

  setEllipsis(ellipsis: string): void {
    const bytes = encodeUtf8(ellipsis);
    sk.sk_paragraph_style_set_ellipsis(this.#ptr, bytes, BigInt(bytes.length));
  }

  get heightMultiplier(): number {
    return sk.sk_paragraph_style_get_height(this.#ptr) as number;
  }

  set heightMultiplier(height: number | undefined) {
    if (height === undefined) return;
    this.setHeight(height);
  }

  setHeight(height: number): void {
    sk.sk_paragraph_style_set_height(this.#ptr, height);
  }

  delete(): void {
    sk.sk_paragraph_style_delete(this.#ptr);
  }
}
