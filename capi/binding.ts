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
export const SK_COLOR_TYPE_RGBA_8888 = 4;
export const SK_ALPHA_TYPE_PREMUL = 2;

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
  sk_surface_make_raster_n32_premul: {
    parameters: ["buffer", "pointer"],
    result: "pointer",
  },
  sk_surface_get_canvas: {
    parameters: ["pointer"],
    result: "pointer",
  },
  sk_surface_make_image_snapshot: {
    parameters: ["pointer"],
    result: "pointer",
  },
  sk_surface_unref: {
    parameters: ["pointer"],
    result: "void",
  },

  // --- Image ---

  sk_image_unref: {
    parameters: ["pointer"],
    result: "void",
  },
  sk_image_new_from_encoded: {
    parameters: ["pointer"],
    result: "pointer",
  },
  sk_image_get_width: {
    parameters: ["pointer"],
    result: "i32",
  },
  sk_image_get_height: {
    parameters: ["pointer"],
    result: "i32",
  },

  // --- Image encoding ---

  sk_encode_png: {
    parameters: ["pointer", "pointer", "i32"],
    result: "pointer",
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

  sk_canvas_draw_path: {
    parameters: ["pointer", "pointer", "pointer"],
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
  sk_string_get_c_str: {
    parameters: ["pointer"],
    result: "pointer",
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
  sk_text_style_set_foreground_paint: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_text_style_set_background_paint: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_text_style_set_decoration_mode: {
    parameters: ["pointer", "i32", "i32", "u32", "i32", "f32"],
    result: "void",
  },
  sk_text_style_set_decoration_color: {
    parameters: ["pointer", "u32"],
    result: "void",
  },
  sk_fontstyle_new: {
    parameters: ["i32", "i32", "i32"],
    result: "pointer",
  },
  sk_text_style_set_fontstyle: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_text_style_set_height: {
    parameters: ["pointer", "f32"],
    result: "void",
  },
  sk_text_style_set_height_override: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  sk_text_style_set_half_leading: {
    parameters: ["pointer", "bool"],
    result: "void",
  },
  sk_text_style_set_letter_spacing: {
    parameters: ["pointer", "f32"],
    result: "void",
  },
  sk_text_style_set_word_spacing: {
    parameters: ["pointer", "f32"],
    result: "void",
  },
  sk_text_style_set_locale: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_text_style_set_text_baseline: {
    parameters: ["pointer", "i32"],
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
  sk_paragraph_style_set_text_align: {
    parameters: ["pointer", "i32"],
    result: "void",
  },
  sk_paragraph_style_set_text_direction: {
    parameters: ["pointer", "i32"],
    result: "void",
  },
  sk_paragraph_style_set_max_lines: {
    parameters: ["pointer", "usize"],
    result: "void",
  },
  sk_paragraph_style_set_ellipsis: {
    parameters: ["pointer", "pointer"],
    result: "void",
  },
  sk_paragraph_style_set_height: {
    parameters: ["pointer", "f32"],
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
  sk_paragraph_builder_pop: {
    parameters: ["pointer"],
    result: "void",
  },
  sk_paragraph_builder_add_text: {
    parameters: ["pointer", "buffer", "usize"],
    result: "void",
  },
  // sk_paragraph_placeholder_style_t:
  //   f32  fWidth
  //   f32  fHeight
  //   i32  fAlignment  (sk_placeholder_alignment_t)
  //   i32  fBaseline   (sk_text_baseline_t)
  //   f32  fBaselineOffset
  sk_paragraph_builder_add_placeholder: {
    parameters: ["pointer", { struct: ["f32", "f32", "i32", "i32", "f32"] }],
    result: "void",
  },
  sk_paragraph_builder_build: {
    parameters: ["pointer"],
    result: "pointer",
  },
  // returns sk_span_t:
  //   pointer  data
  //   usize    size
  sk_paragraph_builder_get_text: {
    parameters: ["pointer"],
    result: { struct: ["pointer", "usize"] },
  },
  sk_paragraph_builder_reset: {
    parameters: ["pointer"],
    result: "void",
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
  sk_paragraph_get_max_width: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_get_min_intrinsic_width: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_get_max_intrinsic_width: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_get_alphabetic_baseline: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_get_ideographic_baseline: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_get_longest_line: {
    parameters: ["pointer"],
    result: "f32",
  },
  sk_paragraph_did_exceed_max_lines: {
    parameters: ["pointer"],
    result: "bool",
  },
  sk_paragraph_paint: {
    parameters: ["pointer", "pointer", "f32", "f32"],
    result: "void",
  },

  // --- Path ---

  sk_path_new: { parameters: [], result: "pointer" },
  sk_path_clone: { parameters: ["pointer"], result: "pointer" },
  sk_path_delete: { parameters: ["pointer"], result: "void" },
  sk_path_reset: { parameters: ["pointer"], result: "void" },
  sk_path_rewind: { parameters: ["pointer"], result: "void" },
  sk_path_get_filltype: { parameters: ["pointer"], result: "i32" },
  sk_path_set_filltype: { parameters: ["pointer", "i32"], result: "void" },
  sk_path_is_empty: { parameters: ["pointer"], result: "bool" },
  sk_path_get_bounds: { parameters: ["pointer", "buffer"], result: "void" },
  sk_path_compute_tight_bounds: { parameters: ["pointer", "buffer"], result: "void" },
  sk_path_count_points: { parameters: ["pointer"], result: "i32" },
  sk_path_get_points: { parameters: ["pointer", "buffer", "i32"], result: "i32" },
  sk_path_get_last_point: { parameters: ["pointer", "buffer"], result: "bool" },
  sk_path_contains: { parameters: ["pointer", "f32", "f32"], result: "bool" },
  sk_path_add_circle: { parameters: ["pointer", "f32", "f32", "f32", "i32"], result: "void" },
  sk_path_add_oval: { parameters: ["pointer", "buffer", "i32"], result: "void" },
  sk_path_add_path: { parameters: ["pointer", "pointer", "i32"], result: "void" },
  sk_path_add_path_matrix: { parameters: ["pointer", "pointer", "buffer", "i32"], result: "void" },
  sk_path_add_path_offset: { parameters: ["pointer", "pointer", "f32", "f32", "i32"], result: "void" },
  sk_path_add_path_reverse: { parameters: ["pointer", "pointer"], result: "void" },
  sk_path_add_poly: { parameters: ["pointer", "buffer", "i32", "bool"], result: "void" },
  sk_path_add_rect: { parameters: ["pointer", "buffer", "i32"], result: "void" },
  sk_path_add_rounded_rect: { parameters: ["pointer", "buffer", "f32", "f32", "i32"], result: "void" },
  sk_path_arc_to: { parameters: ["pointer", "f32", "f32", "f32", "i32", "i32", "f32", "f32"], result: "void" },
  sk_path_arc_to_with_oval: { parameters: ["pointer", "buffer", "f32", "f32", "bool"], result: "void" },
  sk_path_arc_to_with_points: { parameters: ["pointer", "f32", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_close: { parameters: ["pointer"], result: "void" },
  sk_path_conic_to: { parameters: ["pointer", "f32", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_cubic_to: { parameters: ["pointer", "f32", "f32", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_line_to: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_path_move_to: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_path_parse_svg_string: { parameters: ["pointer", "buffer"], result: "bool" },
  sk_path_quad_to: { parameters: ["pointer", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_rquad_to: { parameters: ["pointer", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_rarc_to: { parameters: ["pointer", "f32", "f32", "f32", "i32", "i32", "f32", "f32"], result: "void" },
  sk_path_rconic_to: { parameters: ["pointer", "f32", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_rcubic_to: { parameters: ["pointer", "f32", "f32", "f32", "f32", "f32", "f32"], result: "void" },
  sk_path_rline_to: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_path_rmove_to: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_path_to_svg_string: { parameters: ["pointer", "bool"], result: "pointer" },
  sk_path_transform: { parameters: ["pointer", "buffer"], result: "void" },
  sk_path_transform_to_dest: { parameters: ["pointer", "buffer", "pointer"], result: "void" },
  
  sk_path_equals: { parameters: ["pointer", "pointer"], result: "bool" },
  sk_path_is_volatile: { parameters: ["pointer"], result: "bool" },
  sk_path_set_is_volatile: { parameters: ["pointer", "bool"], result: "void" },
  sk_path_offset: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_path_get_point: { parameters: ["pointer", "i32", "buffer"], result: "void" },
  sk_path_is_convex: { parameters: ["pointer"], result: "bool" },
  sk_path_is_oval: { parameters: ["pointer", "buffer"], result: "bool" },
  sk_path_is_rrect: { parameters: ["pointer", "buffer"], result: "bool" },
  sk_path_is_rect: { parameters: ["pointer", "buffer", "buffer", "buffer"], result: "bool" },
  sk_path_is_line: { parameters: ["pointer", "buffer"], result: "bool" },
  sk_path_is_finite: { parameters: ["pointer"], result: "bool" },
  sk_path_is_last_contour_closed: { parameters: ["pointer"], result: "bool" },
  sk_path_is_inverse_fill_type: { parameters: ["pointer"], result: "bool" },
  sk_path_interpolate: { parameters: ["pointer", "pointer", "f32", "pointer"], result: "bool" },
  sk_path_is_interpolatable: { parameters: ["pointer", "pointer"], result: "bool" },

  sk_path_make_as_winding: { parameters: ["pointer", "pointer"], result: "bool" },

  sk_path_to_cmds: { parameters: ["pointer"], result: "pointer" },
  sk_path_cmds_delete: { parameters: ["pointer"], result: "void" },
  sk_path_make_from_cmds: { parameters: ["buffer", "i32", "pointer"], result: "bool" },
  sk_path_make_from_verbs_points_weights: { parameters: ["buffer", "i32", "buffer", "i32", "buffer", "i32", "pointer"], result: "bool" },

  sk_path_effect_create_dash: { parameters: ["buffer", "i32", "f32"], result: "pointer" },
  sk_path_effect_create_trim: { parameters: ["f32", "f32", "i32"], result: "pointer" },
  sk_path_effect_filter_path: { parameters: ["pointer", "pointer", "pointer", "buffer"], result: "bool" },
  sk_path_effect_unref: { parameters: ["pointer"], result: "void" },

  sk_path_op: { parameters: ["pointer", "pointer", "i32", "pointer"], result: "bool" },
  sk_path_simplify: { parameters: ["pointer", "pointer"], result: "bool" },
  sk_opbuilder_new: { parameters: [], result: "pointer" },
  sk_opbuilder_add: { parameters: ["pointer", "pointer", "i32"], result: "void" },
  sk_opbuilder_resolve: { parameters: ["pointer", "pointer"], result: "bool" },
  sk_opbuilder_destroy: { parameters: ["pointer"], result: "void" },

  // --- Paint ---

  sk_paint_new: { parameters: [], result: "pointer" },
  sk_paint_clone: { parameters: ["pointer"], result: "pointer" },
  sk_paint_delete: { parameters: ["pointer"], result: "void" },
  sk_paint_set_style: { parameters: ["pointer", "i32"], result: "void" },
  sk_paint_get_style: { parameters: ["pointer"], result: "i32" },
  sk_paint_set_stroke_width: { parameters: ["pointer", "f32"], result: "void" },
  sk_paint_get_stroke_width: { parameters: ["pointer"], result: "f32" },
  sk_paint_set_stroke_miter: { parameters: ["pointer", "f32"], result: "void" },
  sk_paint_get_stroke_miter: { parameters: ["pointer"], result: "f32" },
  sk_paint_set_stroke_cap: { parameters: ["pointer", "i32"], result: "void" },
  sk_paint_get_stroke_cap: { parameters: ["pointer"], result: "i32" },
  sk_paint_set_stroke_join: { parameters: ["pointer", "i32"], result: "void" },
  sk_paint_get_stroke_join: { parameters: ["pointer"], result: "i32" },
  sk_paint_get_fill_path: { parameters: ["pointer", "pointer", "pointer", "pointer", "f32"], result: "bool" },
  sk_paint_set_color4f: { parameters: ["pointer", "buffer", "pointer"], result: "void" },
  sk_paint_get_color: { parameters: ["pointer"], result: "u32" },
  sk_paint_set_antialias: { parameters: ["pointer", "bool"], result: "void" },
  sk_paint_is_antialias: { parameters: ["pointer"], result: "bool" },
  sk_paint_set_shader: { parameters: ["pointer", "pointer"], result: "void" },
  sk_paint_set_maskfilter: { parameters: ["pointer", "pointer"], result: "void" },
  sk_paint_set_blend_mode: { parameters: ["pointer", "i32"], result: "void" },
  sk_paint_set_colorfilter: { parameters: ["pointer", "pointer"], result: "void" },
  sk_paint_set_imagefilter: { parameters: ["pointer", "pointer"], result: "void" },
  sk_paint_set_path_effect: { parameters: ["pointer", "pointer"], result: "void" },
  sk_paint_set_dither: { parameters: ["pointer", "bool"], result: "void" },

  // --- MaskFilter ---

  sk_maskfilter_new_blur_with_flags: { parameters: ["i32", "f32", "bool"], result: "pointer" },
  sk_maskfilter_unref: { parameters: ["pointer"], result: "void" },

  // --- Shader ---

  sk_shader_new_linear_gradient_color4f: {
    parameters: ["buffer", "buffer", "pointer", "buffer", "i32", "i32", "pointer"],
    result: "pointer",
  },
  sk_shader_new_radial_gradient_color4f: {
    parameters: ["buffer", "f32", "buffer", "pointer", "buffer", "i32", "i32", "pointer"],
    result: "pointer",
  },
  sk_shader_new_sweep_gradient_color4f: {
    parameters: ["buffer", "buffer", "pointer", "buffer", "i32", "i32", "f32", "f32", "pointer"],
    result: "pointer",
  },
  sk_shader_new_two_point_conical_gradient_color4f: {
    parameters: ["buffer", "f32", "buffer", "f32", "buffer", "pointer", "buffer", "i32", "i32", "pointer"],
    result: "pointer",
  },
  sk_shader_new_color4f: { parameters: ["buffer", "pointer"], result: "pointer" },
  sk_shader_new_blend: { parameters: ["i32", "pointer", "pointer"], result: "pointer" },
  sk_shader_unref: { parameters: ["pointer"], result: "void" },

  // --- Canvas (extended) ---

  sk_canvas_save: { parameters: ["pointer"], result: "i32" },
  sk_canvas_restore: { parameters: ["pointer"], result: "void" },
  sk_canvas_restore_to_count: { parameters: ["pointer", "i32"], result: "void" },
  sk_canvas_get_save_count: { parameters: ["pointer"], result: "i32" },
  sk_canvas_save_layer: { parameters: ["pointer", "buffer", "pointer"], result: "i32" },
  sk_canvas_save_layer_alpha: { parameters: ["pointer", "buffer", "u8"], result: "i32" },
  sk_canvas_scale: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_canvas_translate: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_canvas_rotate_radians: { parameters: ["pointer", "f32"], result: "void" },
  sk_canvas_skew: { parameters: ["pointer", "f32", "f32"], result: "void" },
  sk_canvas_concat: { parameters: ["pointer", "buffer"], result: "void" },
  sk_canvas_get_total_matrix: { parameters: ["pointer", "buffer"], result: "void" },
  sk_canvas_draw_rect: { parameters: ["pointer", "buffer", "pointer"], result: "void" },
  sk_canvas_draw_round_rect: { parameters: ["pointer", "buffer", "f32", "f32", "pointer"], result: "void" },
  sk_canvas_draw_line: { parameters: ["pointer", "f32", "f32", "f32", "f32", "pointer"], result: "void" },
  sk_canvas_draw_circle: { parameters: ["pointer", "f32", "f32", "f32", "pointer"], result: "void" },
  sk_canvas_draw_oval: { parameters: ["pointer", "buffer", "pointer"], result: "void" },
  sk_canvas_draw_arc: { parameters: ["pointer", "buffer", "f32", "f32", "bool", "pointer"], result: "void" },
  sk_canvas_draw_paint: { parameters: ["pointer", "pointer"], result: "void" },
  sk_canvas_draw_color4f: { parameters: ["pointer", "buffer", "i32"], result: "void" },
  sk_canvas_draw_points: { parameters: ["pointer", "i32", "usize", "buffer", "pointer"], result: "void" },
  sk_canvas_clip_rect_with_operation: { parameters: ["pointer", "buffer", "i32", "bool"], result: "void" },
  sk_canvas_clip_path_with_operation: { parameters: ["pointer", "pointer", "i32", "bool"], result: "void" },
  sk_canvas_draw_image_rect: {
    parameters: ["pointer", "pointer", "buffer", "buffer", "buffer", "pointer", "i32"],
    result: "void",
  },

  // --- Data ---

  sk_data_new_with_copy: { parameters: ["buffer", "usize"], result: "pointer" },
  sk_data_get_data: { parameters: ["pointer"], result: "pointer" },
  sk_data_get_size: { parameters: ["pointer"], result: "usize" },
  sk_data_unref: { parameters: ["pointer"], result: "void" },

  // --- Font ---

  sk_font_new_with_values: { parameters: ["pointer", "f32", "f32", "f32"], result: "pointer" },
  sk_font_delete: { parameters: ["pointer"], result: "void" },
  sk_font_get_size: { parameters: ["pointer"], result: "f32" },
  sk_font_set_size: { parameters: ["pointer", "f32"], result: "void" },
  sk_font_get_metrics: { parameters: ["pointer", "buffer"], result: "f32" },
  sk_font_text_to_glyphs: { parameters: ["pointer", "buffer", "usize", "i32", "buffer", "i32"], result: "i32" },
  sk_font_glyph_widths: { parameters: ["pointer", "buffer", "i32", "buffer", "buffer"], result: "void" },
  sk_font_set_subpixel: { parameters: ["pointer", "bool"], result: "void" },
  sk_font_set_hinting: { parameters: ["pointer", "i32"], result: "void" },

  // --- Font manager (extended) ---

  sk_fontmgr_create_from_data: { parameters: ["pointer", "pointer", "i32"], result: "pointer" },

  // --- Font collection (extended) ---

  sk_font_collection_enable_font_fallback: { parameters: ["pointer"], result: "void" },

  // --- Typeface ---

  sk_typeface_unref: { parameters: ["pointer"], result: "void" },

  // --- Paragraph (extended) ---

  // FFI-friendly wrappers: returns heap-allocated sk_text_box_t array,
  // writes element count to the count_out buffer (4-byte i32).
  // Caller must free the returned pointer with sk_text_box_data_free.
  sk_paragraph_get_rects_for_range2: {
    parameters: ["pointer", "u32", "u32", "i32", "i32", "buffer"],
    result: "pointer",
  },
  sk_text_box_data_free: {
    parameters: ["pointer"],
    result: "void",
  },

  // FFI-friendly wrapper: returns position (i32), writes affinity to buffer (4-byte i32).
  sk_paragraph_get_glyph_position_at_coordinate2: {
    parameters: ["pointer", "f32", "f32", "buffer"],
    result: "i32",
  },

  sk_paragraph_get_word_boundary: {
    parameters: ["pointer", "i32", "buffer"],
    result: "void",
  },
  sk_paragraph_get_rects_for_placeholders2: {
    parameters: ["pointer", "buffer"],
    result: "pointer",
  },

  // --- TypefaceFontProvider ---

  sk_typeface_font_provider_new: { parameters: [], result: "pointer" },
  sk_typeface_font_provider_register_typeface: {
    parameters: ["pointer", "pointer", "pointer"],
    result: "void",
  },
  sk_typeface_font_provider_unref: { parameters: ["pointer"], result: "void" },
  sk_typeface_font_provider_as_fontmgr: { parameters: ["pointer"], result: "pointer" },

  // --- Matrix ---

  sk_matrix_concat: { parameters: ["buffer", "buffer", "buffer"], result: "void" },
  sk_matrix_invert: { parameters: ["buffer", "buffer"], result: "bool" },
  sk_matrix_map_points: { parameters: ["buffer", "buffer", "buffer", "i32"], result: "void" },
  sk_matrix_rotate_rad: { parameters: ["f32", "buffer"], result: "void" },
  sk_matrix_scale: { parameters: ["f32", "f32", "buffer"], result: "void" },
  sk_matrix_translate: { parameters: ["f32", "f32", "buffer"], result: "void" },
  sk_matrix_skew: { parameters: ["f32", "f32", "buffer"], result: "void" },

  // --- Color / HSV ---

  sk_rgb_to_hsv: {
    parameters: ["u8", "u8", "u8", "buffer"],
    result: "void",
  },
  sk_hsv_to_color: {
    parameters: ["u8", "buffer"],
    result: "u32",
  },

  // --- Image codecs ---

  register_image_codecs: {
    parameters: [],
    result: "void",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function asFfiBuffer(view: ArrayBufferView): Uint8Array<ArrayBuffer> {
  if (view.buffer instanceof ArrayBuffer) {
    return new Uint8Array(
      view.buffer,
      view.byteOffset,
      view.byteLength,
    ) as Uint8Array<ArrayBuffer>;
  }
  const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const out = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  out.set(bytes);
  return out;
}

export function toF32Bytes(arr: Float32Array | number[]): Uint8Array<ArrayBuffer> {
  const f32 = arr instanceof Float32Array ? arr : new Float32Array(arr);
  return asFfiBuffer(f32);
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

/**
 * Build an sk_image_info_t struct for RGBA_8888 premul.
 * Layout: { colorSpace*: 8, colorType: i32, alphaType: i32, width: i32, height: i32 } = 24 bytes.
 */
export function createImageInfo(
  width: number,
  height: number,
  colorType: number = SK_COLOR_TYPE_RGBA_8888,
  alphaType: number = SK_ALPHA_TYPE_PREMUL,
): Uint8Array<ArrayBuffer> {
  const ab = new ArrayBuffer(24);
  const dv = new DataView(ab);
  dv.setBigUint64(0, 0n, true);
  dv.setInt32(8, colorType, true);
  dv.setInt32(12, alphaType, true);
  dv.setInt32(16, width, true);
  dv.setInt32(20, height, true);
  return new Uint8Array(ab);
}
