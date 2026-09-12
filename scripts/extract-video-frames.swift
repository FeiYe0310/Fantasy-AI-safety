import AppKit
import AVFoundation
import Foundation

guard (4...5).contains(CommandLine.arguments.count) else {
    fputs("Usage: swift extract-video-frames.swift INPUT.mp4 OUTPUT_DIR FPS [WIDTH]\n", stderr)
    exit(64)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
guard let framesPerSecond = Double(CommandLine.arguments[3]), framesPerSecond > 0 else {
    fputs("FPS must be a positive number.\n", stderr)
    exit(64)
}
let targetWidth = CommandLine.arguments.count == 5 ? Int(CommandLine.arguments[4]) : nil

let fileManager = FileManager.default
try fileManager.createDirectory(at: outputURL, withIntermediateDirectories: true)

let asset = AVURLAsset(url: inputURL)
let duration = CMTimeGetSeconds(try await asset.load(.duration))
guard duration.isFinite, duration > 0 else {
    fputs("The input video has no usable duration.\n", stderr)
    exit(65)
}

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero
if let width = targetWidth, width > 0 {
    generator.maximumSize = CGSize(width: width, height: width)
}

let frameCount = max(2, Int(floor(duration * framesPerSecond)) + 1)
let times = (0..<frameCount).map { index in
    let seconds = min(duration - 0.001, Double(index) / framesPerSecond)
    return CMTime(seconds: max(0, seconds), preferredTimescale: 600)
}

for (index, time) in times.enumerated() {
    autoreleasepool {
        do {
            let image = try generator.copyCGImage(at: time, actualTime: nil)
            let representation = NSBitmapImageRep(cgImage: image)
            guard let data = representation.representation(
                using: .jpeg,
                properties: [.compressionFactor: 0.9]
            ) else { throw NSError(domain: "FrameSequence", code: 1) }
            let filename = String(format: "%04d.jpg", index)
            try data.write(to: outputURL.appendingPathComponent(filename), options: .atomic)
        } catch {
            fputs("Failed frame \(index): \(error)\n", stderr)
            exit(66)
        }
    }
}

print("Extracted \(frameCount) frames at \(framesPerSecond) fps from \(inputURL.lastPathComponent)")

