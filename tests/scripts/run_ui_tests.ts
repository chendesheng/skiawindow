/**
 * Wrapper script for running UI tests via xcodebuild.
 *
 * Usage:
 *   deno task test:ui                           # run all UI tests
 *   deno task test:ui EventTests/testAllKeys    # run a single test
 *   deno task test:ui EventTests                # run a test class
 */

import { parseArgs } from "https://deno.land/std/cli/parse_args.ts";

const args = parseArgs(Deno.args, {
  boolean: ["update"],
  default: { update: false },
});

const filter = args._.length > 0 ? String(args._[0]) : null;

const containerSnapDir =
  "~/Library/Containers/com.skiawindow.testapp.uitests.xctrunner/Data/tmp/skiawindow_snapshots";

const clean = new Deno.Command("bash", {
  args: ["-c", `rm -rf ${containerSnapDir}`],
});
await clean.output();

const xcodebuildArgs = [
  "test",
  "-project", "tests/fixtures/SkiaWindowTests.xcodeproj",
  "-scheme", "TestAppUITests",
  "-destination", "platform=macOS",
];

if (filter) {
  const testId = filter.includes("/")
    ? `TestAppUITests/${filter}`
    : `TestAppUITests/${filter}`;
  xcodebuildArgs.push(`-only-testing:${testId}`);
}

if (args.update) {
  Deno.env.set("TEST_RUNNER_SNAPSHOT_UPDATE", "1");
}

const xcodebuild = new Deno.Command("xcodebuild", {
  args: xcodebuildArgs,
  stdout: "inherit",
  stderr: "inherit",
});
const result = await xcodebuild.output();

const copyArgs = ["run", "--allow-read", "--allow-write", "--allow-env",
  "tests/scripts/copy_snapshots.ts"];
if (args.update) {
  copyArgs.push("--update");
}
const copy = new Deno.Command("deno", {
  args: copyArgs,
  stdout: "inherit",
  stderr: "inherit",
});
await copy.output();

Deno.exit(result.code);
