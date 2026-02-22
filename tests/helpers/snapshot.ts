/**
 * Snapshot testing helpers for Deno.
 *
 * Baselines are stored in tests/__snapshots__/ and failure artifacts go to
 * tests/__snapshots_output__/.
 */

import pixelmatch from "npm:pixelmatch@^7";
import { PNG } from "npm:pngjs@^7";
import { Buffer } from "node:buffer";
import { dirname, fromFileUrl, join } from "jsr:@std/path@^1";
import { Surface } from "../../capi/Surface.ts";
import type { Canvas } from "../../capi/Canvas.ts";

const testsDir = join(dirname(fromFileUrl(import.meta.url)), "..");
const snapshotsDir = join(testsDir, "__snapshots__");
const outputDir = join(testsDir, "__snapshots_output__");

const isUpdate = Deno.args.includes("--update");

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function decodePNG(data: Uint8Array): { width: number; height: number; data: Uint8Array } {
  const png = PNG.sync.read(Buffer.from(data));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

// ---------------------------------------------------------------------------
// Generic snapshot assertion
// ---------------------------------------------------------------------------

/**
 * Compare `data` against a stored baseline file.
 *
 * @param data     Serialized actual snapshot (PNG bytes, UTF-8 text, etc.)
 * @param name     File name **including extension** (e.g. "test_foo.png").
 * @param compare  Receives the baseline bytes; return `null` on match or an
 *                 error message on mismatch.
 */
export async function assertSnapshot(
  data: Uint8Array,
  name: string,
  compare: (baseline: Uint8Array) => string | null,
): Promise<void> {
  const baselinePath = join(snapshotsDir, name);

  let baselineBytes: Uint8Array | null;
  try {
    baselineBytes = await Deno.readFile(baselinePath);
  } catch {
    baselineBytes = null;
  }

  // Case 1: Baseline missing -- auto-record
  if (baselineBytes === null) {
    await Deno.mkdir(snapshotsDir, { recursive: true });
    await Deno.writeFile(baselinePath, data);
    await writeFailureArtifact(name, data);
    throw new Error(`Recorded new baseline: ${name}. Re-run to verify.`);
  }

  // Case 2: Baseline exists -- compare
  const message = compare(baselineBytes);
  if (message === null) {
    return; // Match -- pass silently
  }

  // Case 2b: Mismatch + update mode -- overwrite baseline
  if (isUpdate) {
    await Deno.writeFile(baselinePath, data);
    await writeFailureArtifact(name, data);
    return;
  }

  // Case 2c: Mismatch -- report failure
  const dot = name.lastIndexOf(".");
  const stem = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : "";
  await writeFailureArtifact(`${stem}_FAIL${ext}`, data);
  throw new Error(message);
}

async function writeFailureArtifact(
  name: string,
  data: Uint8Array,
): Promise<void> {
  await Deno.mkdir(outputDir, { recursive: true });
  await Deno.writeFile(join(outputDir, name), data);
}

// ---------------------------------------------------------------------------
// Image snapshot convenience
// ---------------------------------------------------------------------------

export interface SnapshotOptions {
  threshold?: number;
  maxDiffPixels?: number;
}

/**
 * Render via the draw callback, encode to PNG, and compare against a baseline.
 */
export async function assertImageSnapshot(
  t: Deno.TestContext,
  width: number,
  height: number,
  draw: (canvas: Canvas) => void,
  options?: SnapshotOptions,
): Promise<void> {
  const { threshold = 0.1, maxDiffPixels = 0 } = options ?? {};
  const name = sanitizeName(t.name);

  const surface = Surface.MakeRaster(width, height);
  const canvas = surface.getCanvas();
  draw(canvas);
  const actualPng = surface.encodePNG();
  surface.delete();

  await assertSnapshot(actualPng, `${name}.png`, (baselineBytes) => {
    const baseline = decodePNG(baselineBytes);
    const actual = decodePNG(actualPng);

    if (baseline.width !== actual.width || baseline.height !== actual.height) {
      return `Snapshot size mismatch: baseline ${baseline.width}x${baseline.height} vs actual ${actual.width}x${actual.height}`;
    }

    const diffBuf = new Uint8Array(width * height * 4);
    const numDiff = pixelmatch(
      baseline.data,
      actual.data,
      diffBuf,
      width,
      height,
      { threshold },
    );

    if (numDiff <= maxDiffPixels) {
      return null;
    }

    const diffPng = new Uint8Array(
      PNG.sync.write(
        Object.assign(new PNG({ width, height }), { data: Buffer.from(diffBuf) }),
      ),
    );
    writeFailureArtifact(`${name}-diff.png`, diffPng);

    return (
      `Snapshot mismatch: ${numDiff} pixels differ (max allowed: ${maxDiffPixels}). ` +
      `See tests/__snapshots_output__/${name}_FAIL.png and ${name}-diff.png`
    );
  });
}
