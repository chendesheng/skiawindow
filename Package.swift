// swift-tools-version: 5.9
import PackageDescription
import Foundation

// Absolute path to the package root — used for paths to pre-built Skia libraries
// that live outside SPM's normal source-tree search.
let pkg      = URL(fileURLWithPath: #file).deletingLastPathComponent().path
let skiaBuild = "\(pkg)/skia/skia/skia/build"

let package = Package(
    name: "cskia",
    platforms: [.macOS(.v14)],
    products: [
        .library(name: "CSkia", type: .dynamic, targets: ["CSkia"]),
        .library(name: "Window", type: .dynamic, targets: ["Window"]),
    ],
    targets: [
        // MARK: CSkia — C wrapper compiled from sk_capi.cpp
        .target(
            name: "CSkia",
            path: "capi",
            exclude: ["binding.ts"],
            sources: ["sk_capi.cpp"],
            publicHeadersPath: ".",
            cxxSettings: [
                .headerSearchPath("../skia/skia"),
                .headerSearchPath("../skia/skia/include"),
                .define("SKIA_C_DLL"),
                .unsafeFlags(["-fvisibility=hidden"]),
            ],
            linkerSettings: [
                .linkedFramework("CoreFoundation"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("CoreText"),
                .linkedFramework("Metal"),
                .linkedFramework("Foundation"),
                .linkedFramework("ImageIO"),
                .unsafeFlags([
                    "-L\(skiaBuild)",
                    "-lskparagraph", "-lskshaper", "-lskia",
                    "-lskunicode_icu", "-lskunicode_core",
                    "-lharfbuzz", "-licu", "-licu_bidi", "-lskcms", "-lpng",
                    "-lc++",
                    "-Xlinker", "-undefined",
                    "-Xlinker", "dynamic_lookup",
                ]),
            ]
        ),

        // MARK: Window — pure Metal + AppKit windowing (no Skia dependency)
        .target(
            name: "Window",
            path: "window",
            exclude: ["binding.ts"],
            linkerSettings: [
                .linkedFramework("Cocoa"),
                .linkedFramework("Metal"),
                .linkedFramework("QuartzCore"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx17
)
