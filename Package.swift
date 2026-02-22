// swift-tools-version: 5.9
import PackageDescription
import Foundation

let pkg       = URL(fileURLWithPath: #file).deletingLastPathComponent().path
let skiaBuild = "\(pkg)/skia/skia/skia/build"

func nonSourceFiles(in dir: String, sourceExtensions: Set<String>) -> [String] {
    (try? FileManager.default.contentsOfDirectory(atPath: "\(pkg)/\(dir)"))?.filter {
        !sourceExtensions.contains(String(($0 as NSString).pathExtension).lowercased())
    } ?? []
}

let package = Package(
    name: "skiawindow",
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
            exclude: nonSourceFiles(in: "capi", sourceExtensions: ["c", "cpp", "h", "modulemap"]),
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
                    "-lharfbuzz", "-licu", "-lskcms", "-lpng",
                    "-lc++",
                    "-Xlinker", "-undefined",
                    "-Xlinker", "dynamic_lookup",
                ]),
            ]
        ),

        // MARK: Clip — cross-platform clipboard library (dacap/clip)
        .target(
            name: "Clip",
            path: ".",
            sources: ["clip/clip.cpp", "clip/clip_osx.mm"],
            publicHeadersPath: "clip_include",
            cxxSettings: [
                .headerSearchPath("clip"),
            ],
            linkerSettings: [
                .linkedFramework("Cocoa"),
            ]
        ),

        // MARK: Window — pure Metal + AppKit windowing (no Skia dependency)
        .target(
            name: "Window",
            dependencies: ["Clip"],
            path: "window",
            exclude: nonSourceFiles(in: "window", sourceExtensions: ["swift"]),
            swiftSettings: [.interoperabilityMode(.Cxx)],
            linkerSettings: [
                .linkedFramework("Cocoa"),
                .linkedFramework("MetalKit"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx17
)
