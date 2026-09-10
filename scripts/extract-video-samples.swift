import AppKit
import AVFoundation
import Foundation

guard CommandLine.arguments.count == 3 else {
    fputs("Usage: swift extract-video-samples.swift INPUT_DIR OUTPUT_DIR\n", stderr)
    exit(64)
}

let fileManager = FileManager.default
let inputDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try fileManager.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

let videos = try fileManager.contentsOfDirectory(
    at: inputDirectory,
    includingPropertiesForKeys: nil,
    options: [.skipsHiddenFiles]
).filter { $0.pathExtension.lowercased() == "mp4" }
 .sorted { $0.lastPathComponent < $1.lastPathComponent }

func writeJPEG(_ image: CGImage, to destination: URL) throws {
    let representation = NSBitmapImageRep(cgImage: image)
    guard let data = representation.representation(using: .jpeg, properties: [.compressionFactor: 0.86]) else {
        throw NSError(domain: "VideoSamples", code: 1)
    }
    try data.write(to: destination, options: .atomic)
}

for videoURL in videos {
    let asset = AVURLAsset(url: videoURL)
    let duration = CMTimeGetSeconds(try await asset.load(.duration))
    guard duration.isFinite, duration > 0.2 else { continue }

    let generator = AVAssetImageGenerator(asset: asset)
    generator.appliesPreferredTrackTransform = true
    generator.requestedTimeToleranceBefore = CMTime(value: 1, timescale: 600)
    generator.requestedTimeToleranceAfter = CMTime(value: 1, timescale: 600)
    let stem = videoURL.deletingPathExtension().lastPathComponent

    for index in 0...4 {
        let fraction = 0.02 + Double(index) * 0.24
        let time = CMTime(seconds: duration * fraction, preferredTimescale: 600)
        let image = try generator.copyCGImage(at: time, actualTime: nil)
        let destination = outputDirectory.appendingPathComponent("\(stem)-\(index).jpg")
        try writeJPEG(image, to: destination)
        print(destination.path)
    }
}
