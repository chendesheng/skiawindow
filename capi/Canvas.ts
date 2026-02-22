import { skLib, toF32Bytes } from "./binding.ts";
import type { Color4f } from "./Color.ts";
import type { Image } from "./Image.ts";
import type { Matrix3x3 } from "./Matrix.ts";
import type { Paint } from "./Paint.ts";
import { Path } from "./Path.ts";
import type { Paragraph } from "./Paragraph.ts";
import { rrectGetRect, rrectIsUniform } from "./Rect.ts";
import type { Rect, RRect } from "./Rect.ts";

const sk = skLib.symbols;

// sk_sampling_options_t: linear filter, no mipmaps (24 bytes)
const DEFAULT_SAMPLING_OPTIONS = (() => {
  const ab = new ArrayBuffer(24);
  const dv = new DataView(ab);
  dv.setInt32(0, 0, true);       // maxAniso
  dv.setUint8(4, 0);             // useCubic = false
  dv.setFloat32(8, 0, true);     // cubic.B
  dv.setFloat32(12, 0, true);    // cubic.C
  dv.setInt32(16, 1, true);      // filter = SK_FILTER_MODE_LINEAR
  dv.setInt32(20, 0, true);      // mipmap = SK_MIPMAP_MODE_NONE
  return new Uint8Array(ab);
})();

export class Canvas {
  #ptr: Deno.PointerValue;

  /** @internal Obtained from Surface.getCanvas(); not user-constructed. */
  constructor(ptr: Deno.PointerValue) {
    this.#ptr = ptr;
  }

  clear(color: Color4f): void {
    sk.sk_canvas_clear_color4f(this.#ptr, color);
  }

  save(): number {
    return sk.sk_canvas_save(this.#ptr) as number;
  }

  restore(): void {
    sk.sk_canvas_restore(this.#ptr);
  }

  restoreToCount(saveCount: number): void {
    sk.sk_canvas_restore_to_count(this.#ptr, saveCount);
  }

  getSaveCount(): number {
    return sk.sk_canvas_get_save_count(this.#ptr) as number;
  }

  saveLayer(paint?: Paint | null, bounds?: Rect | null): number {
    const boundsBytes = bounds ? toF32Bytes(bounds) : null;
    return sk.sk_canvas_save_layer(
      this.#ptr,
      boundsBytes,
      paint ? paint._ptr : null,
    ) as number;
  }

  saveLayerAlpha(rect: Rect | null, alpha: number): number {
    const rectBytes = rect ? toF32Bytes(rect) : null;
    return sk.sk_canvas_save_layer_alpha(this.#ptr, rectBytes, alpha) as number;
  }

  scale(sx: number, sy: number): void {
    sk.sk_canvas_scale(this.#ptr, sx, sy);
  }

  translate(dx: number, dy: number): void {
    sk.sk_canvas_translate(this.#ptr, dx, dy);
  }

  rotate(degrees: number, rx: number, ry: number): void {
    if (rx !== 0 || ry !== 0) {
      sk.sk_canvas_translate(this.#ptr, rx, ry);
    }
    sk.sk_canvas_rotate_radians(this.#ptr, (degrees * Math.PI) / 180);
    if (rx !== 0 || ry !== 0) {
      sk.sk_canvas_translate(this.#ptr, -rx, -ry);
    }
  }

  skew(sx: number, sy: number): void {
    sk.sk_canvas_skew(this.#ptr, sx, sy);
  }

  concat(matrix: Matrix3x3): void {
    sk.sk_canvas_concat(this.#ptr, toF32Bytes(matrix));
  }

  getTotalMatrix(): Matrix3x3 {
    const buf = new Float32Array(9);
    sk.sk_canvas_get_total_matrix(this.#ptr, toF32Bytes(buf));
    return buf;
  }

  drawPath(path: Path, paint: Paint): void {
    sk.sk_canvas_draw_path(this.#ptr, path._ptr, paint._ptr);
  }

  drawRect(rect: Rect, paint: Paint): void {
    sk.sk_canvas_draw_rect(this.#ptr, toF32Bytes(rect), paint._ptr);
  }

  /**
   * Draw a rounded rectangle. Accepts a 12-float RRect matching CanvasKit.
   * For uniform corners uses sk_canvas_draw_round_rect; for non-uniform
   * corners constructs a temporary path.
   */
  drawRRect(rrect: RRect, paint: Paint): void {
    const rectBytes = toF32Bytes(rrectGetRect(rrect));
    if (rrectIsUniform(rrect)) {
      sk.sk_canvas_draw_round_rect(this.#ptr, rectBytes, rrect[4], rrect[5], paint._ptr);
    } else {
      const p = new Path();
      p.addRRect(rrect);
      sk.sk_canvas_draw_path(this.#ptr, p._ptr, paint._ptr);
      p.delete();
    }
  }

  drawLine(
    x0: number, y0: number, x1: number, y1: number,
    paint: Paint,
  ): void {
    sk.sk_canvas_draw_line(this.#ptr, x0, y0, x1, y1, paint._ptr);
  }

  drawCircle(cx: number, cy: number, radius: number, paint: Paint): void {
    sk.sk_canvas_draw_circle(this.#ptr, cx, cy, radius, paint._ptr);
  }

  drawOval(rect: Rect, paint: Paint): void {
    sk.sk_canvas_draw_oval(this.#ptr, toF32Bytes(rect), paint._ptr);
  }

  drawArc(
    oval: Rect, startAngle: number, sweepAngle: number,
    useCenter: boolean, paint: Paint,
  ): void {
    sk.sk_canvas_draw_arc(
      this.#ptr, toF32Bytes(oval), startAngle, sweepAngle, useCenter, paint._ptr,
    );
  }

  drawPaint(paint: Paint): void {
    sk.sk_canvas_draw_paint(this.#ptr, paint._ptr);
  }

  drawColor(color: Color4f, blendMode: number = 3 /* SrcOver */): void {
    sk.sk_canvas_draw_color4f(this.#ptr, toF32Bytes(color), blendMode);
  }

  drawPoints(mode: number, points: Float32Array, paint: Paint): void {
    const count = points.length / 2;
    sk.sk_canvas_draw_points(this.#ptr, mode, BigInt(count), toF32Bytes(points), paint._ptr);
  }

  clipRect(rect: Rect, op: number, antialias: boolean = false): void {
    sk.sk_canvas_clip_rect_with_operation(this.#ptr, toF32Bytes(rect), op, antialias);
  }

  clipPath(path: Path, op: number, antialias: boolean = false): void {
    sk.sk_canvas_clip_path_with_operation(this.#ptr, path._ptr, op, antialias);
  }

  clipRRect(rrect: RRect, op: number, antialias: boolean = false): void {
    const p = new Path();
    p.addRRect(rrect);
    sk.sk_canvas_clip_path_with_operation(this.#ptr, p._ptr, op, antialias);
    p.delete();
  }

  drawParagraph(p: Paragraph, x: number, y: number): void {
    sk.sk_paragraph_paint(p._ptr, this.#ptr, x, y);
  }

  drawImageRect(image: Image, src: Rect, dst: Rect, paint: Paint): void {
    sk.sk_canvas_draw_image_rect(
      this.#ptr,
      image._ptr,
      toF32Bytes(src),
      toF32Bytes(dst),
      DEFAULT_SAMPLING_OPTIONS,
      paint._ptr,
      1, // SRC_RECT_CONSTRAINT_FAST
    );
  }
}
