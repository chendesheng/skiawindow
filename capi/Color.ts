import { skLib } from "./binding.ts";

const sk = skLib.symbols;

/** Packed uint32 ARGB color, same as SkColor / sk_color_t. */
export type Color = number;

/** 4-element Float32Array [R, G, B, A] in 0..1, matches sk_color4f_t layout. */
export type Color4f = Float32Array<ArrayBuffer>;

/** 3-element Float32Array [hue 0..360, saturation 0..1, value 0..1]. */
export type HSV = Float32Array<ArrayBuffer>;

export function Color(a: number, r: number, g: number, b: number): Color {
  return (((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) |
    (b & 0xff)) >>> 0;
}

export function Color4f(
  r: number,
  g: number,
  b: number,
  a: number = 1.0,
): Color4f {
  return new Float32Array([r, g, b, a]);
}

export function Color4fFromColor(color: Color): Color4f {
  return new Float32Array([
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
    ((color >>> 24) & 0xff) / 255,
  ]);
}

export function color4fToColor(c: Color4f): Color {
  const a = Math.round(c[3] * 255) & 0xff;
  const r = Math.round(c[0] * 255) & 0xff;
  const g = Math.round(c[1] * 255) & 0xff;
  const b = Math.round(c[2] * 255) & 0xff;
  return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
}

export function colorToColor4f(color: Color): Color4f {
  return Color4fFromColor(color);
}

export function color4fSetAlpha(c: Color4f, a: number): Color4f {
  c[3] = a;
  return c;
}

export function color4fToHSV(c: Color4f): HSV {
  const r = Math.round(c[0] * 255) & 0xff;
  const g = Math.round(c[1] * 255) & 0xff;
  const b = Math.round(c[2] * 255) & 0xff;
  const hsv = new Float32Array(3);
  sk.sk_rgb_to_hsv(r, g, b, hsv);
  return hsv;
}

export function hsvToColor4f(hsv: HSV, alpha: number = 1.0): Color4f {
  const a = Math.round(alpha * 255) & 0xff;
  const color = sk.sk_hsv_to_color(a, hsv) as number;
  const c = Color4fFromColor(color);
  c[3] = alpha;
  return c;
}

export const Transparent: Color4f = Color4f(0, 0, 0, 0);
export const Black: Color4f = Color4f(0, 0, 0, 1);
export const White: Color4f = Color4f(1, 1, 1, 1);
export const Red: Color4f = Color4f(1, 0, 0, 1);
export const Green: Color4f = Color4f(0, 1, 0, 1);
export const Blue: Color4f = Color4f(0, 0, 1, 1);
export const Yellow: Color4f = Color4f(1, 1, 0, 1);
export const Cyan: Color4f = Color4f(0, 1, 1, 1);
export const Magenta: Color4f = Color4f(1, 0, 1, 1);
export const DkGray: Color4f = Color4f(0.25, 0.25, 0.25, 1);
export const Gray: Color4f = Color4f(0.50, 0.50, 0.50, 1);
export const LtGray: Color4f = Color4f(0.75, 0.75, 0.75, 1);
