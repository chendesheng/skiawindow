import { asFfiBuffer, encodeUtf8, skLib, skStringNew } from "./binding.ts";
import { FontStyle } from "./FontStyle.ts";

const sk = skLib.symbols;

export class TypefaceFontProvider {
  #ptr: Deno.PointerValue;

  private constructor(ptr: Deno.PointerValue) {
    this.#ptr = ptr;
  }

  get _ptr(): Deno.PointerValue {
    return this.#ptr;
  }

  static Make(): TypefaceFontProvider {
    const ptr = sk.sk_typeface_font_provider_new();
    return new TypefaceFontProvider(ptr);
  }

  /**
   * Register a font (as raw bytes) under a family name alias.
   * Internally creates a typeface from the data and registers it.
   */
  registerFont(fontData: Uint8Array, familyName: string): void {
    const buf = asFfiBuffer(fontData);
    const dataPtr = sk.sk_data_new_with_copy(buf, BigInt(buf.length));
    if (!dataPtr) throw new Error("Failed to create SkData from font bytes");

    const fontMgrPtr = sk.sk_fontmgr_ref_default();
    const typefacePtr = sk.sk_fontmgr_create_from_data(fontMgrPtr, dataPtr, 0);
    sk.sk_data_unref(dataPtr);

    if (!typefacePtr) {
      throw new Error("Failed to create typeface from font data");
    }

    const aliasStr = skStringNew(familyName);
    sk.sk_typeface_font_provider_register_typeface(
      this.#ptr,
      typefacePtr,
      aliasStr,
    );
    sk.sk_string_delete(aliasStr);
  }

  /**
   * Cast this provider to a FontMgr pointer for use with FontCollection.
   */
  asFontMgr(): Deno.PointerValue {
    return sk.sk_typeface_font_provider_as_fontmgr(this.#ptr);
  }

  matchFamilyStyle(
    familyName: string,
    style?: FontStyle,
  ): Deno.PointerValue {
    const family = encodeUtf8(`${familyName}\0`);
    const fontStyle = style ?? new FontStyle();
    try {
      const typeface = sk.sk_fontmgr_match_family_style(
        this.asFontMgr(),
        asFfiBuffer(family),
        fontStyle._ptr,
      );
      if (!typeface) {
        throw new Error(`Failed to resolve typeface for family: ${familyName}`);
      }
      return typeface;
    } finally {
      if (!style) {
        fontStyle.delete();
      }
    }
  }

  delete(): void {
    sk.sk_typeface_font_provider_unref(this.#ptr);
  }
}
