import Foundation
import Vision
import CoreImage
import AppKit

guard CommandLine.arguments.count > 2 else {
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let inputURL = URL(fileURLWithPath: inputPath)

guard let ciImage = CIImage(contentsOf: inputURL) else {
    exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ciImage)
do {
    try handler.perform([request])
    guard let result = request.results?.first else {
        exit(1)
    }
    
    let maskPixelBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
    let maskCI = CIImage(cvPixelBuffer: maskPixelBuffer)
    
    guard let blendFilter = CIFilter(name: "CIBlendWithMask") else {
        exit(1)
    }
    
    let transparent = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0)).cropped(to: ciImage.extent)
    blendFilter.setValue(ciImage, forKey: kCIInputImageKey)
    blendFilter.setValue(transparent, forKey: kCIInputBackgroundImageKey)
    blendFilter.setValue(maskCI, forKey: kCIInputMaskImageKey)
    
    guard let outputCI = blendFilter.outputImage else {
        exit(1)
    }
    
    let context = CIContext()
    guard let cgImage = context.createCGImage(outputCI, from: outputCI.extent) else {
        exit(1)
    }
    
    let rep = NSBitmapImageRep(cgImage: cgImage)
    guard let pngData = rep.representation(using: .png, properties: [:]) else {
        exit(1)
    }
    try pngData.write(to: URL(fileURLWithPath: outputPath))
} catch {
    exit(1)
}
