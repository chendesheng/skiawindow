/**
 * capi/binding.ts — Deno FFI bindings for libCSkia.dylib (Skia C API).
 */

import { join, dirname, fromFileUrl } from "jsr:@std/path@^1";

const libDir = join(dirname(fromFileUrl(import.meta.url)), "..", ".build", "release");
const libPath = join(libDir, "libCSkia.dylib");

const utf8Encoder = new TextEncoder();

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GR_SURFACE_ORIGIN_TOP_LEFT = 0;
export const SK_COLOR_TYPE_BGRA_8888 = 6;

// ---------------------------------------------------------------------------
// FFI symbol definitions
// ---------------------------------------------------------------------------

export const skLib = Deno.dlopen(libPath, {
  // --- GPU / Metal backend ---

  gr_direct_context_make_metal: {
    parameters: ["buffer"],
    result: "pointer",
  },
  gr_direct_context_flush_and_submit: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  gr_direct_context_release_resources_and_abandon_context: {
    parameters: ["pointer"],
    result: "void",
  },
  gr_direct_context_delete: {
    parameters: ["pointer"],
    result: "void",
  },
  gr_backendrendertarget_new_metal: {
    parameters: ["i32", "i32", "buffer"],
    result: "pointer",
  },
  gr_backendrendertarget_delete: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Surface ---

  sk_surface_new_backend_render_target: {
    parameters: ["pointer", "pointer", "i32", "i32", "pointer", "pointer"],
    result: "pointer",
  },
  sk_surface_get_canvas: {
    parameters: ["pointer"],
    result: "pointer",
  },
  sk_surface_unref: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Canvas ---

  sk_canvas_clear: {
    parameters: ["pointer", "u32"],
    result: "void",
  },
  sk_canvas_clear_color4f: {
    parameters: ["pointer", "buffer"],
    result: "void",
  },

  // --- Font manager ---

  sk_fontmgr_ref_default: {
    parameters: [],
    result: "pointer",
  },

  // --- Font collection ---

  sk_font_collection_new: {
    parameters: [],
    result: "pointer",
  },
  sk_font_collection_set_default_font_manager: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_font_collection_unref: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- sk_string ---

  sk_string_new: {
    parameters: ["buffer", "usize"],
    result: "pointer",
  },
  sk_string_delete: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Text style ---

  sk_text_style_create: {
    parameters: [],
    result: "pointer",
  },
  sk_text_style_set_color: {
    parameters: ["pointer", "u32"],
    result: "void",
  },
  sk_text_style_set_font_size: {
    parameters: ["pointer", "f32"],
    result: "void",
  },
  sk_text_style_set_font_families: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
  },

  // --- Paragraph style ---

  sk_paragraph_style_new: {
    parameters: [],
    result: "pointer",
  },
  sk_paragraph_style_set_text_style: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_paragraph_style_delete: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Paragraph builder ---

  sk_paragraph_builder_new: {
    parameters: ["pointer", "pointer"],
    result: "pointer",
  },
  sk_paragraph_builder_push_style: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_paragraph_builder_add_text: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
  },
  sk_paragraph_builder_build: {
    parameters: ["pointer"],
    result: "pointer",
  },
  sk_paragraph_builder_delete: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Paragraph ---

  sk_paragraph_layout: {
    parameters: ["pointer", "f32"],
    result: "void",
  },
  sk_paragraph_get_height: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_paint: {
    parameters: ["pointer", "pointer", "f32", "f32"],
    result: "void",
  },

  // --- Color / HSV ---

  sk_rgb_to_hsv: {
    parameters: ["u8", "u8", "u8", "buffer"],
    result: "void",
  },
  sk_hsv_to_color: {
    parameters: ["u8", "buffer"],
    result: "u32",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asFfiBuffer(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.buffer instanceof ArrayBuffer) {
    return new Uint8Array(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ) as Uint8Array<ArrayBuffer>;
  }
  const out = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  out.set(bytes);
  return out;
}

export function encodeUtf8(s: string): Uint8Array<ArrayBuffer> {
  const encoded = utf8Encoder.encode(s);
  return asFfiBuffer(encoded);
}

export function pointerArrayBuffer(
  ptrs: Deno.PointerValue[],
): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(8 * ptrs.length);
  const view = new DataView(ab);
  for (let i = 0; i < ptrs.length; i++) {
    const p = Deno.UnsafePointer.value(ptrs[i]);
    view.setBigUint64(i * 8, BigInt(p), true);
  }
  return new Uint8Array(ab);
}

/** Pack a pointer value into an 8-byte little-endian buffer. */
function pointerToBuffer(ptr: Deno.PointerValue): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(8);
  new DataView(ab).setBigUint64(0, BigInt(Deno.UnsafePointer.value(ptr)), true);
  return new Uint8Array(ab);
}

/** Build a gr_mtl_backendcontext_t { fDevice, fQueue } struct (16 bytes). */
export function createGrContext(
  device: Deno.PointerValue,
  queue: Deno.PointerValue,
): Deno.PointerValue {
  const ab = new ArrayBuffer(16);
  const dv = new DataView(ab);
  dv.setBigUint64(0, BigInt(Deno.UnsafePointer.value(device)), true);
  dv.setBigUint64(8, BigInt(Deno.UnsafePointer.value(queue)), true);
  const ctx = skLib.symbols.gr_direct_context_make_metal(new Uint8Array(ab));
  if (!ctx) throw new Error("Failed to create GrDirectContext");
  return ctx;
}

/** Build a gr_backendrendertarget_t from a Metal texture pointer. */
export function createBackendRenderTarget(
  w: number,
  h: number,
  texture: Deno.PointerValue,
): Deno.PointerValue {
  const texInfo = pointerToBuffer(texture);
  const target = skLib.symbols.gr_backendrendertarget_new_metal(w, h, texInfo);
  if (!target) throw new Error("Failed to create GrBackendRenderTarget");
  return target;
}

export function skStringNew(s: string): Deno.PointerValue {
  const bytes = encodeUtf8(s);
  return skLib.symbols.sk_string_new(bytes, BigInt(bytes.length));
}

export function paragraphBuilderAddText(
  builder: Deno.PointerValue,
  text: string,
): void {
  paragraphBuilderAddUtf8(builder, encodeUtf8(text));
}

export function paragraphBuilderAddUtf8(
  builder: Deno.PointerValue,
  utf8: Uint8Array,
): void {
  const bytes = asFfiBuffer(utf8);
  skLib.symbols.sk_paragraph_builder_add_text(
    builder,
    bytes,
    BigInt(bytes.length),
  );
}
