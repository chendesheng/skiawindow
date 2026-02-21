import { asFfiBuffer, encodeUtf8, skLib, toF32Bytes } from "./binding.ts";

const sk = skLib.symbols;

export type Rect = Float32Array;
export type InputRect = Rect | number[];
export type RRect = Float32Array;
export type InputRRect = RRect | number[];
export type InputFlattenedPointArray = Float32Array | number[];
export type VerbList = Uint8Array | number[];
export type WeightList = Float32Array | number[];
export type InputCommands = Float32Array | number[];

export enum PathOp {
  Difference = 0,
  Intersect = 1,
  Union = 2,
  XOR = 3,
  ReverseDifference = 4,
}

export enum FillType {
  Winding = 0,
  EvenOdd = 1,
  InverseWinding = 2,
  InverseEvenOdd = 3,
}

export enum StrokeCap {
  Butt = 0,
  Round = 1,
  Square = 2,
}

export enum StrokeJoin {
  Miter = 0,
  Round = 1,
  Bevel = 2,
}

export interface StrokeOpts {
  width?: number;
  miter_limit?: number;
  cap?: StrokeCap;
  join?: StrokeJoin;
  precision?: number;
}

export interface Point {
  x: number;
  y: number;
}

export class Path {
  public readonly _ptr: Deno.PointerValue;

  constructor(ptr?: Deno.PointerValue) {
    if (ptr) {
      this._ptr = ptr;
    } else {
      this._ptr = sk.sk_path_new();
    }
  }

  delete(): void {
    if (this._ptr) {
      sk.sk_path_delete(this._ptr);
    }
  }

  // --- Static Factories ---

  static Make(): Path {
    return new Path();
  }

  static CanInterpolate(path1: Path, path2: Path): boolean {
    return sk.sk_path_is_interpolatable(path1._ptr, path2._ptr);
  }

  static MakeFromCmds(cmds: InputCommands): Path | null {
    const arr = cmds instanceof Float32Array ? cmds : new Float32Array(cmds);
    const bytes = toF32Bytes(arr);
    const numCmds = arr.length;
    const result = new Path();
    if (sk.sk_path_make_from_cmds(bytes, numCmds, result._ptr)) {
      return result;
    }
    result.delete();
    return null;
  }

  static MakeFromOp(one: Path, two: Path, op: PathOp): Path | null {
    const result = new Path();
    if (sk.sk_path_op(one._ptr, two._ptr, op as number, result._ptr)) {
      return result;
    }
    result.delete();
    return null;
  }

  static MakeFromPathInterpolation(
    start: Path,
    end: Path,
    weight: number,
  ): Path | null {
    const result = new Path();
    if (sk.sk_path_interpolate(start._ptr, end._ptr, weight, result._ptr)) {
      return result;
    }
    result.delete();
    return null;
  }

  static MakeFromSVGString(str: string): Path | null {
    const path = new Path();
    const bytes = encodeUtf8(str);
    const nullTerminated = new Uint8Array(bytes.length + 1);
    nullTerminated.set(bytes);
    if (sk.sk_path_parse_svg_string(path._ptr, nullTerminated)) {
      return path;
    }
    path.delete();
    return null;
  }

  static MakeFromVerbsPointsWeights(
    verbs: VerbList,
    points: InputFlattenedPointArray,
    weights?: WeightList,
  ): Path {
    const verbsArr = asFfiBuffer(verbs instanceof Uint8Array ? verbs : new Uint8Array(verbs));
    const ptsBytes = toF32Bytes(points);
    const wtsBytes = weights ? toF32Bytes(weights) : toF32Bytes([]);
    
    const numVerbs = verbsArr.length;
    const numPts = (ptsBytes.length / 4);
    const numWts = weights ? (wtsBytes.length / 4) : 0;

    const result = new Path();
    sk.sk_path_make_from_verbs_points_weights(
      verbsArr as unknown as Uint8Array<ArrayBuffer>,
      numVerbs,
      ptsBytes as unknown as Uint8Array<ArrayBuffer>,
      numPts,
      wtsBytes as unknown as Uint8Array<ArrayBuffer>,
      numWts,
      result._ptr,
    );
    return result;
  }

  // --- Instance Methods ---

  addArc(oval: InputRect, startAngle: number, sweepAngle: number): Path {
    sk.sk_path_arc_to_with_oval(
      this._ptr,
      toF32Bytes(oval),
      startAngle,
      sweepAngle,
      true,
    );
    return this;
  }

  addCircle(x: number, y: number, r: number, isCCW?: boolean): Path {
    sk.sk_path_add_circle(this._ptr, x, y, r, isCCW ? 1 : 0);
    return this;
  }

  addOval(oval: InputRect, isCCW?: boolean, startIndex?: number): Path {
    sk.sk_path_add_oval(this._ptr, toF32Bytes(oval), isCCW ? 1 : 0);
    return this;
  }

  addPath(other: Path, matrix?: Float32Array | number[]): Path {
    if (matrix) {
      sk.sk_path_add_path_matrix(this._ptr, other._ptr, toF32Bytes(matrix), 0); // 0 = append
    } else {
      sk.sk_path_add_path(this._ptr, other._ptr, 0); // 0 = append
    }
    return this;
  }

  addPoly(points: InputFlattenedPointArray, close: boolean): Path {
    const count = points.length / 2;
    sk.sk_path_add_poly(this._ptr, toF32Bytes(points), count, close);
    return this;
  }

  addRect(rect: InputRect, isCCW?: boolean): Path {
    sk.sk_path_add_rect(this._ptr, toF32Bytes(rect), isCCW ? 1 : 0);
    return this;
  }

  addRRect(rrect: InputRRect, isCCW?: boolean): Path {
    const arr = rrect instanceof Float32Array ? rrect : new Float32Array(rrect);
    const rectBytes = toF32Bytes(arr.subarray(0, 4));
    const rx = arr.length >= 6 ? arr[4] : 0;
    const ry = arr.length >= 6 ? arr[5] : 0;
    sk.sk_path_add_rounded_rect(this._ptr, rectBytes, rx, ry, isCCW ? 1 : 0);
    return this;
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    isCCW?: boolean,
  ): Path {
    const oval = new Float32Array([
      x - radius,
      y - radius,
      x + radius,
      y + radius,
    ]);
    let sweep = endAngle - startAngle;
    if (isCCW && sweep > 0) {
      sweep -= Math.PI * 2;
    } else if (!isCCW && sweep < 0) {
      sweep += Math.PI * 2;
    }
    const r2d = 180 / Math.PI;
    sk.sk_path_arc_to_with_oval(
      this._ptr,
      toF32Bytes(oval),
      startAngle * r2d,
      sweep * r2d,
      false,
    );
    return this;
  }

  arcToOval(
    oval: InputRect,
    startAngle: number,
    sweepAngle: number,
    forceMoveTo: boolean,
  ): Path {
    sk.sk_path_arc_to_with_oval(
      this._ptr,
      toF32Bytes(oval),
      startAngle,
      sweepAngle,
      forceMoveTo,
    );
    return this;
  }

  arcToRotated(
    rx: number,
    ry: number,
    xAxisRotate: number,
    useSmallArc: boolean,
    isCCW: boolean,
    x: number,
    y: number,
  ): Path {
    sk.sk_path_arc_to(
      this._ptr,
      rx,
      ry,
      xAxisRotate,
      useSmallArc ? 0 : 1,
      isCCW ? 1 : 0,
      x,
      y,
    );
    return this;
  }

  arcToTangent(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
  ): Path {
    sk.sk_path_arc_to_with_points(this._ptr, x1, y1, x2, y2, radius);
    return this;
  }

  close(): Path {
    sk.sk_path_close(this._ptr);
    return this;
  }

  computeTightBounds(outputArray?: Float32Array): Float32Array {
    const out = outputArray || new Float32Array(4);
    const bytes = toF32Bytes(out);
    sk.sk_path_compute_tight_bounds(this._ptr, bytes);
    out.set(new Float32Array(bytes.buffer));
    return out;
  }

  conicTo(x1: number, y1: number, x2: number, y2: number, w: number): Path {
    sk.sk_path_conic_to(this._ptr, x1, y1, x2, y2, w);
    return this;
  }

  contains(x: number, y: number): boolean {
    return sk.sk_path_contains(this._ptr, x, y);
  }

  copy(): Path {
    return new Path(sk.sk_path_clone(this._ptr));
  }

  countPoints(): number {
    return sk.sk_path_count_points(this._ptr);
  }

  cubicTo(
    cpx1: number,
    cpy1: number,
    cpx2: number,
    cpy2: number,
    x: number,
    y: number,
  ): Path {
    sk.sk_path_cubic_to(this._ptr, cpx1, cpy1, cpx2, cpy2, x, y);
    return this;
  }

  dash(on: number, off: number, phase: number): boolean {
    const intervals = new Float32Array([on, off]);
    const effect = sk.sk_path_effect_create_dash(
      toF32Bytes(intervals),
      2,
      phase,
    );
    if (!effect) return false;
    const ok = sk.sk_path_effect_filter_path(
      effect,
      this._ptr,
      this._ptr,
      null,
    );
    sk.sk_path_effect_unref(effect);
    return ok;
  }

  equals(other: Path): boolean {
    return sk.sk_path_equals(this._ptr, other._ptr);
  }

  getBounds(outputArray?: Float32Array): Float32Array {
    const out = outputArray || new Float32Array(4);
    const bytes = toF32Bytes(out);
    sk.sk_path_get_bounds(this._ptr, bytes);
    out.set(new Float32Array(bytes.buffer));
    return out;
  }

  getFillType(): FillType {
    return sk.sk_path_get_filltype(this._ptr) as FillType;
  }

  getPoint(index: number, outputArray?: Point): Point {
    const outBytes = new Uint8Array(8); // 2 floats
    sk.sk_path_get_point(this._ptr, index, outBytes);
    const f32 = new Float32Array(outBytes.buffer);
    if (outputArray) {
      outputArray.x = f32[0];
      outputArray.y = f32[1];
      return outputArray;
    }
    return { x: f32[0], y: f32[1] };
  }

  isEmpty(): boolean {
    return sk.sk_path_is_empty(this._ptr);
  }

  isVolatile(): boolean {
    return sk.sk_path_is_volatile(this._ptr);
  }

  lineTo(x: number, y: number): Path {
    sk.sk_path_line_to(this._ptr, x, y);
    return this;
  }

  makeAsWinding(): Path | null {
    const result = new Path();
    if (sk.sk_path_make_as_winding(this._ptr, result._ptr)) {
      return result;
    }
    result.delete();
    return null;
  }

  moveTo(x: number, y: number): Path {
    sk.sk_path_move_to(this._ptr, x, y);
    return this;
  }

  offset(dx: number, dy: number): Path {
    sk.sk_path_offset(this._ptr, dx, dy);
    return this;
  }

  op(other: Path, op: PathOp): boolean {
    return sk.sk_path_op(this._ptr, other._ptr, op as number, this._ptr);
  }

  quadTo(x1: number, y1: number, x2: number, y2: number): Path {
    sk.sk_path_quad_to(this._ptr, x1, y1, x2, y2);
    return this;
  }

  rArcTo(
    rx: number,
    ry: number,
    xAxisRotate: number,
    useSmallArc: boolean,
    isCCW: boolean,
    dx: number,
    dy: number,
  ): Path {
    sk.sk_path_rarc_to(
      this._ptr,
      rx,
      ry,
      xAxisRotate,
      useSmallArc ? 0 : 1,
      isCCW ? 1 : 0,
      dx,
      dy,
    );
    return this;
  }

  rConicTo(
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
    w: number,
  ): Path {
    sk.sk_path_rconic_to(this._ptr, dx1, dy1, dx2, dy2, w);
    return this;
  }

  rCubicTo(
    cpx1: number,
    cpy1: number,
    cpx2: number,
    cpy2: number,
    x: number,
    y: number,
  ): Path {
    sk.sk_path_rcubic_to(this._ptr, cpx1, cpy1, cpx2, cpy2, x, y);
    return this;
  }

  reset(): void {
    sk.sk_path_reset(this._ptr);
  }

  rewind(): void {
    sk.sk_path_rewind(this._ptr);
  }

  rLineTo(x: number, y: number): Path {
    sk.sk_path_rline_to(this._ptr, x, y);
    return this;
  }

  rMoveTo(x: number, y: number): Path {
    sk.sk_path_rmove_to(this._ptr, x, y);
    return this;
  }

  rQuadTo(x1: number, y1: number, x2: number, y2: number): Path {
    sk.sk_path_rquad_to(this._ptr, x1, y1, x2, y2);
    return this;
  }

  setFillType(fill: FillType): void {
    sk.sk_path_set_filltype(this._ptr, fill as number);
  }

  setIsVolatile(isVolatile: boolean): void {
    sk.sk_path_set_is_volatile(this._ptr, isVolatile);
  }

  simplify(): boolean {
    return sk.sk_path_simplify(this._ptr, this._ptr);
  }

  stroke(opts?: StrokeOpts): Path | null {
    const paint = sk.sk_paint_new();
    sk.sk_paint_set_style(paint, 1); // 1 = stroke
    if (opts) {
      if (opts.width !== undefined) {
        sk.sk_paint_set_stroke_width(paint, opts.width);
      }
      if (opts.miter_limit !== undefined) {
        sk.sk_paint_set_stroke_miter(paint, opts.miter_limit);
      }
      if (opts.cap !== undefined) sk.sk_paint_set_stroke_cap(paint, opts.cap);
      if (opts.join !== undefined) {
        sk.sk_paint_set_stroke_join(paint, opts.join);
      }
    }

    const result = new Path();
    const precision = opts?.precision !== undefined ? opts.precision : 1;
    const ok = sk.sk_paint_get_fill_path(
      paint,
      this._ptr,
      result._ptr,
      null,
      precision,
    );

    sk.sk_paint_delete(paint);

    if (ok) return result;
    result.delete();
    return null;
  }

  toCmds(): Float32Array {
    const structPtr = sk.sk_path_to_cmds(this._ptr);
    if (!structPtr) return new Float32Array(0);

    const view = new Deno.UnsafePointerView(structPtr);
    // On 64-bit platforms, float* is 8 bytes, followed by int (4 bytes) at offset 8.
    const ptr = view.getPointer(0);
    const size = view.getInt32(8);

    if (!ptr || size === 0) {
      sk.sk_path_cmds_delete(structPtr);
      return new Float32Array(0);
    }

    const arrayView = new Deno.UnsafePointerView(ptr);
    const out = new Float32Array(size);
    const buffer = new Uint8Array(out.buffer);
    arrayView.copyInto(buffer);

    sk.sk_path_cmds_delete(structPtr);
    return out;
  }

  toSVGString(): string {
    const strPtr = sk.sk_path_to_svg_string(this._ptr, true);
    if (!strPtr) return "";
    const cStr = sk.sk_string_get_c_str(strPtr);
    if (!cStr) {
      sk.sk_string_delete(strPtr);
      return "";
    }
    const view = new Deno.UnsafePointerView(cStr);
    const str = view.getCString();
    sk.sk_string_delete(strPtr);
    return str;
  }

  transform(matrix: Float32Array | number[]): Path {
    sk.sk_path_transform(this._ptr, toF32Bytes(matrix));
    return this;
  }

  trim(startT: number, stopT: number, isComplement: boolean): Path | null {
    const mode = isComplement ? 1 : 0; // 0 = normal, 1 = inverted
    const effect = sk.sk_path_effect_create_trim(startT, stopT, mode);
    if (!effect) return null;
    const result = new Path();
    const ok = sk.sk_path_effect_filter_path(
      effect,
      this._ptr,
      result._ptr,
      null,
    );
    sk.sk_path_effect_unref(effect);
    if (ok) return result;
    result.delete();
    return null;
  }
}
