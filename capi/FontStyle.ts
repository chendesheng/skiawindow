import { FontSlant, FontWeight, FontWidth } from "./Enums.ts";
import { skLib } from "./binding.ts";

const sk = skLib.symbols;

export interface FontStyleOptions {
  weight?: number;
  width?: number;
  slant?: number;
}

export class FontStyle {
  #ptr: Deno.PointerValue;

  constructor({
    weight = FontWeight.Normal,
    width = FontWidth.Normal,
    slant = FontSlant.Upright,
  }: FontStyleOptions = {}) {
    this.#ptr = sk.sk_fontstyle_new(weight, width, slant);
    if (!this.#ptr) {
      throw new Error("Failed to create FontStyle");
    }
  }

  get _ptr(): Deno.PointerValue {
    return this.#ptr;
  }

  delete(): void {
    sk.sk_fontstyle_delete(this.#ptr);
  }
}
