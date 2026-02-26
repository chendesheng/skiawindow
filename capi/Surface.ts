import {
  createBackendRenderTarget,
  createImageInfo,
  GR_SURFACE_ORIGIN_TOP_LEFT,
  SK_COLOR_TYPE_BGRA_8888,
  skLib,
} from "./binding.ts";
import { Canvas } from "./Canvas.ts";
import type { GrDirectContext } from "./GrDirectContext.ts";
import { Image } from "./Image.ts";

const sk = skLib.symbols;

export class Surface {
  #ptr: Deno.PointerValue;
  #backendTarget: Deno.PointerValue;

  private constructor(
    ptr: Deno.PointerValue,
    backendTarget: Deno.PointerValue = null,
  ) {
    this.#ptr = ptr;
    this.#backendTarget = backendTarget;
  }

  static MakeFromBackendRenderTarget(
    ctx: GrDirectContext,
    width: number,
    height: number,
    texture: Deno.PointerValue,
    origin: number = GR_SURFACE_ORIGIN_TOP_LEFT,
    colorType: number = SK_COLOR_TYPE_BGRA_8888,
  ): Surface | null {
    const target = createBackendRenderTarget(width, height, texture);
    const ptr = sk.sk_surface_new_backend_render_target(
      ctx._ptr,
      target,
      origin,
      colorType,
      null,
      null,
    );
    if (!ptr) {
      sk.gr_backendrendertarget_delete(target);
      return null;
    }
    return new Surface(ptr, target);
  }

  static MakeRaster(width: number, height: number): Surface {
    const info = createImageInfo(width, height);
    const ptr = sk.sk_surface_make_raster_n32_premul(info, null);
    if (!ptr) throw new Error("Failed to create raster surface");
    return new Surface(ptr);
  }

  getCanvas(): Canvas {
    const ptr = sk.sk_surface_get_canvas(this.#ptr);
    return new Canvas(ptr);
  }

  makeImageSnapshot(): Image {
    const img = sk.sk_surface_make_image_snapshot(this.#ptr);
    if (!img) throw new Error("Failed to make image snapshot");
    return new Image(img);
  }

  /**
   * Encode the surface contents as PNG bytes.
   * Takes a snapshot, encodes it, and returns the raw PNG data.
   */
  encodePNG(compressionLevel: number = 6): Uint8Array {
    const img = this.makeImageSnapshot();
    try {
      const data = sk.sk_encode_png(null, img._ptr, compressionLevel);
      if (!data) throw new Error("Failed to encode PNG");
      try {
        const size = Number(sk.sk_data_get_size(data));
        const rawPtr = sk.sk_data_get_data(data);
        const view = new Deno.UnsafePointerView(rawPtr!);
        const out = new Uint8Array(size);
        view.copyInto(out);
        return out;
      } finally {
        sk.sk_data_unref(data);
      }
    } finally {
      img.delete();
    }
  }

  delete(): void {
    sk.sk_surface_unref(this.#ptr);
    if (this.#backendTarget) {
      sk.gr_backendrendertarget_delete(this.#backendTarget);
    }
  }
}
