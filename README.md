# skiawindow

C/Swift bindings for Skia + Metal windowing on macOS, driven by Deno FFI.

These have been tailored to the needs of my specific projects and may not be suitable for anyone else.

## Skia version

The Skia version with which these bindings have been tested is from _Mon Apr 21 12:56:08 PDT 2025_

* <https://github.com/google/skia/tree/chrome/m136>
* <https://chromium.googlesource.com/chromium/tools/depot_tools.git/+/5d891d2a8dd455a73ce6b9a835a6f575a549825b>

See the file skia/skia/RELEASE_NOTES.txt for changes made to skia.

## Prerequisites

- macOS 14+
- Deno
- Swift toolchain (Xcode or swift.org)
- Skia built via `./build.sh` (fetches depot_tools + skia sources automatically)

## Deno Commands

All commands are defined in `deno.json` and run from the `skiawindow/` directory.

### Build native libraries

```sh
deno task build
```

Runs `swift build -c release`, producing `libCSkia.dylib` and `libWindow.dylib` in `.build/release/`.

### Run the demo app

```sh
deno run --allow-ffi --allow-read --unstable-ffi main.ts
```

Opens a Metal-backed NSWindow that renders Skia text and logs input events.

### Run unit tests

```sh
deno task test
```

Builds the native libraries first, then runs all Deno tests in `tests/` with snapshot comparison. Equivalent to:

```sh
deno task build && deno test --allow-ffi --allow-read --allow-write --unstable-ffi tests/
```

### Update test snapshots

```sh
deno task test:update
```

Same as `test`, but passes `--update` to regenerate snapshot images in `tests/__snapshots__/`. Equivalent to:

```sh
deno task build && deno test --allow-ffi --allow-read --allow-write --unstable-ffi tests/ -- --update
```

### Run UI tests (XCTest)

```sh
deno task test:ui
```

Launches the test apps via Deno and runs XCTest-based UI tests against them. Equivalent to:

```sh
deno run --allow-read --allow-write --allow-env --allow-run tests/scripts/run_ui_tests.ts
```

### Update UI test snapshots

```sh
deno task test:ui:update
```

Same as `test:ui`, but passes `--update` to regenerate UI test snapshots. Equivalent to:

```sh
deno run --allow-read --allow-write --allow-env --allow-run tests/scripts/run_ui_tests.ts --update
```

## Build Skia from source

```sh
./build.sh
```

Fetches depot_tools and skia sources, applies patches, and builds the static library. Options:

| Flag | Description |
|---|---|
| `-a`, `--args` | Show available GN build args (no build) |
| `-c`, `--clean` | Remove `dist/` and `skia/build/` (no build) |
| `-C`, `--CLEAN` | Remove `dist/` and `skia/` entirely (no build) |
| `-h`, `--help` | Print help |

## Project Structure

```
skiawindow/
├── capi/           # Skia C API FFI bindings (TypeScript + C++)
├── window/         # Metal + AppKit windowing FFI bindings (TypeScript + Swift)
├── tests/          # Deno tests and XCTest UI tests
├── skia/           # Skia source (fetched by build.sh)
├── clip/           # Cross-platform clipboard library (dacap/clip)
├── Package.swift   # Swift Package Manager manifest
├── build.sh        # Skia build script
├── main.ts         # Demo app entry point
└── deno.json       # Deno task definitions
```
