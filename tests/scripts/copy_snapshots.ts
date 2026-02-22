import { dirname, fromFileUrl, join } from "jsr:@std/path@^1";
import { copy } from "jsr:@std/fs@^1/copy";
import { ensureDir } from "jsr:@std/fs@^1/ensure-dir";
import { emptyDir } from "jsr:@std/fs@^1/empty-dir";

const testsDir = join(dirname(fromFileUrl(import.meta.url)), "..");
const snapshotsDir = join(testsDir, "__snapshots__");
const outputDir = join(testsDir, "__snapshots_output__");
const snapDir = join(
  Deno.env.get("HOME")!,
  "Library/Containers/com.skiawindow.testapp.uitests.xctrunner/Data/tmp/skiawindow_snapshots",
);

// Always copy failure artifacts to __snapshots_output__/
await emptyDir(outputDir);
let failCount = 0;
try {
  for await (const entry of Deno.readDir(snapDir)) {
    if (entry.isFile && entry.name.endsWith("_FAIL.png")) {
      await copy(join(snapDir, entry.name), join(outputDir, entry.name), {
        overwrite: true,
      });
      console.log(`  failure: ${entry.name}`);
      failCount++;
    }
  }
} catch (e) {
  if (!(e instanceof Deno.errors.NotFound)) throw e;
}
if (failCount > 0) {
  console.log(
    `Copied ${failCount} failure artifact(s) to tests/__snapshots_output__/`,
  );
}

// Copy manifest entries to __snapshots__/ based on category
const isUpdate = Deno.args.includes("--update");
const manifestPath = join(snapDir, "manifest.json");
try {
  const manifest: { missing: string[]; updated: string[] } = JSON.parse(
    await Deno.readTextFile(manifestPath),
  );
  const toCopy = [...manifest.missing];
  if (isUpdate) toCopy.push(...manifest.updated);

  if (toCopy.length > 0) {
    await ensureDir(snapshotsDir);
    for (const name of toCopy) {
      const src = join(snapDir, `${name}.png`);
      const dest = join(snapshotsDir, `${name}.png`);
      await copy(src, dest, { overwrite: true });
      const label = manifest.missing.includes(name)
        ? "new baseline"
        : "updated";
      console.log(`  ${label}: ${name}`);
    }
    console.log(`Copied ${toCopy.length} baseline(s) to tests/__snapshots__/`);
  }
} catch (e) {
  if (e instanceof Deno.errors.NotFound) {
    // no manifest -- nothing was recorded
  } else {
    throw e;
  }
}
