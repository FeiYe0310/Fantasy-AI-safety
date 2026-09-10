import AppKit
import AVFoundation
import Foundation

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: swift extract-video-boundaries.swift INPUT_DIR OUTPUT_DIR\n", stderr)
    exit(64)
}

let fileManager = FileManager.default
let inputDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try fileManager.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let videoURLs = try fileManager.contentsOfDirectory(
    at: inputDirectory,
    includingPropertiesForKeys: nil,
    options: [.skipsHiddenFiles]
).filter { $0.pathExtension.lowercased() == "mp4" }
 .sorted { $0.lastPathComponent < $1.lastPathComponent }

func writeJPEG(_ image: CGImage, to destination: URL) throws {
    let representation = NSBitmapImageRep(cgImage: image)
    guard let data = representation.representation(
        using: .jpeg,
        properties: [.compressionFactor: 0.9]
    ) else {
        throw NSError(domain: "BoundaryFrame", code: 1)
    }
    try data.write(to: destination, options: .atomic)
}

for videoURL in videoURLs {
    let asset = AVURLAsset(url: videoURL)
    let duration = CMTimeGetSeconds(try await asset.load(.duration))
    guard duration.isFinite, duration > 0.2 else { continue }

    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 600)
    generator.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 600)

    let stem = videoURL.deletingPathExtension().lastPathComponent
    let samples: [(String, Double)] = [
        ("start", min(0.05, duration * 0.01)),
        ("end", max(0, duration - min(0.08, duration * 0.016))),
    ]

    for (suffix, seconds) in samples {
        let time = CMTime(seconds: seconds, preferredTimescale: 600)
        let image = try generator.copyCGImage(at: time, actualTime: nil)
        let destination = outputDirectory.appendingPathComponent("\(stem)-\(suffix).jpg")
        try writeJPEG(image, to: destination)
        print(destination.path)
    }
}
