import { skLib, asFfiBuffer } from "./binding.ts";

const sk = skLib.symbols;

export class Image {
  #ptr: Deno.PointerValue;

  constructor(ptr: Deno.PointerValue) {
    if (!ptr) throw new Error("Image pointer is null");
    this.#ptr = ptr;
  }

  get _ptr(): Deno.PointerValue {
    return this.#ptr;
  }

  width(): number {
    return sk.sk_image_get_width(this.#ptr) as number;
  }

  height(): number {
    return sk.sk_image_get_height(this.#ptr) as number;
  }

  delete(): void {
    if (this.#ptr) {
      sk.sk_image_unref(this.#ptr);
      this.#ptr = null;
    }
  }

  static MakeFromEncoded(data: Uint8Array): Image | null {
    const buf = asFfiBuffer(data);
    const skData = sk.sk_data_new_with_copy(buf, BigInt(buf.byteLength));
    if (!skData) return null;

    const imgPtr = sk.sk_image_new_from_encoded(skData);
    sk.sk_data_unref(skData);

    if (!imgPtr) return null;
    return new Image(imgPtr);
  }
}
