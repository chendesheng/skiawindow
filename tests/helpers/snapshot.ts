/**
 * Image snapshot testing helper for Deno.
 *
 * Renders to a CPU raster surface, encodes to PNG, and compares against
 * a baseline image using pixelmatch. Baselines are stored in
 * tests/__snapshots__/ and failure artifacts (actual + diff) go to
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

export interface SnapshotOptions {
  threshold?: number;
  maxDiffPixels?: number;
}

/**
 * Assert that a drawing operation produces an image matching the stored baseline.
 *
 * - Missing baseline: auto-records to __snapshots__/ and fails (re-run to verify).
 * - Match: passes silently.
 * - Mismatch + `--update`: overwrites baseline and passes.
 * - Mismatch (normal): writes failure artifacts and fails.
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

  const baselinePath = join(snapshotsDir, `${name}.png`);

  let baselineBytes: Uint8Array | null;
  try {
    baselineBytes = await Deno.readFile(baselinePath);
  } catch {
    baselineBytes = null;
  }

  // Case 1: Baseline missing -- auto-record
  if (baselineBytes === null) {
    await Deno.mkdir(snapshotsDir, { recursive: true });
    await Deno.writeFile(baselinePath, actualPng);
    await writeFailureArtifacts(name, actualPng);
    throw new Error(
      `Recorded new baseline: ${name}. Re-run to verify.`,
    );
  }

  // Case 2: Baseline exists -- compare
  const baseline = decodePNG(baselineBytes);
  const actual = decodePNG(actualPng);

  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    if (isUpdate) {
      await Deno.writeFile(baselinePath, actualPng);
      await writeFailureArtifacts(name, actualPng);
      return;
    }
    await writeFailureArtifacts(name, actualPng);
    throw new Error(
      `Snapshot size mismatch: baseline ${baseline.width}x${baseline.height} vs actual ${actual.width}x${actual.height}`,
    );
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
    return; // Case 2a: Match -- pass silently
  }

  const diffPng = new Uint8Array(
    PNG.sync.write(
      Object.assign(new PNG({ width, height }), { data: Buffer.from(diffBuf) }),
    ),
  );

  // Case 2b: Mismatch + update mode -- overwrite baseline and pass
  if (isUpdate) {
    await Deno.writeFile(baselinePath, actualPng);
    await writeFailureArtifacts(name, actualPng, diffPng);
    return;
  }

  // Case 2c: Mismatch -- report failure
  await writeFailureArtifacts(name, actualPng, diffPng);
  throw new Error(
    `Snapshot mismatch: ${numDiff} pixels differ (max allowed: ${maxDiffPixels}). ` +
    `See tests/__snapshots_output__/${name}-actual.png and ${name}-diff.png`,
  );
}

async function writeFailureArtifacts(
  name: string,
  actualPng: Uint8Array,
  diffPng?: Uint8Array,
): Promise<void> {
  await Deno.mkdir(outputDir, { recursive: true });
  await Deno.writeFile(join(outputDir, `${name}-actual.png`), actualPng);
  if (diffPng) {
    await Deno.writeFile(join(outputDir, `${name}-diff.png`), diffPng);
  }
}
