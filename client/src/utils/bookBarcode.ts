import {
    BinaryBitmap, BrowserMultiFormatReader, ChecksumException, DecodeHintType,
    FormatException, HybridBinarizer, NotFoundException, RGBLuminanceSource
} from "@zxing/library";
import { MatMarkers, PixelImage, perspectiveTransform } from "./bookMeasurement";

export interface BarcodeSearchArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type BarcodeQuadrilateral = MatMarkers;

function decodeLuminance(data: Uint8ClampedArray, width: number, height: number): string | null {
    try {
        const hints = new Map([[DecodeHintType.TRY_HARDER, true]]);
        return new BrowserMultiFormatReader(hints).decodeBitmap(new BinaryBitmap(new HybridBinarizer(
            new RGBLuminanceSource(data, width, height)
        ))).getText();
    } catch (cause) {
        if (cause instanceof NotFoundException || cause instanceof ChecksumException || cause instanceof FormatException) {
            return null;
        }
        throw cause;
    }
}

function rotateLuminance(data: Uint8ClampedArray, width: number, height: number, degrees: number):
    { data: Uint8ClampedArray; width: number; height: number } {
    const radians = degrees * Math.PI / 180;
    const cos = Math.cos(radians), sin = Math.sin(radians);
    const rotatedWidth = Math.ceil(Math.abs(width * cos) + Math.abs(height * sin));
    const rotatedHeight = Math.ceil(Math.abs(height * cos) + Math.abs(width * sin));
    const rotated = new Uint8ClampedArray(rotatedWidth * rotatedHeight).fill(255);
    const centerX = (width - 1) / 2, centerY = (height - 1) / 2;
    const rotatedCenterX = (rotatedWidth - 1) / 2, rotatedCenterY = (rotatedHeight - 1) / 2;
    for (let y = 0; y < rotatedHeight; y++) {
        for (let x = 0; x < rotatedWidth; x++) {
            const dx = x - rotatedCenterX, dy = y - rotatedCenterY;
            const sourceX = Math.round(cos * dx + sin * dy + centerX);
            const sourceY = Math.round(-sin * dx + cos * dy + centerY);
            if (sourceX >= 0 && sourceY >= 0 && sourceX < width && sourceY < height) {
                rotated[y * rotatedWidth + x] = data[sourceY * width + sourceX];
            }
        }
    }
    return { data: rotated, width: rotatedWidth, height: rotatedHeight };
}

function decodeRotatedLuminance(data: Uint8ClampedArray, width: number, height: number,
    angles: number[]): string | null {
    for (const angle of angles) {
        const rotated = angle === 0 ? { data, width, height } : rotateLuminance(data, width, height, angle);
        const barcode = decodeLuminance(rotated.data, rotated.width, rotated.height);
        if (barcode) return barcode;
    }
    return null;
}

function decodeBookCorner(image: PixelImage, luminance: Uint8ClampedArray, area: BarcodeSearchArea,
    corner: number): string | null {
    const fraction = 0.4;
    const width = Math.round(area.width * fraction), height = Math.round(area.height * fraction);
    const imageLeft = Math.max(0, Math.floor(area.x));
    const imageTop = Math.max(0, Math.floor(area.y));
    const imageRight = Math.min(image.width, Math.ceil(area.x + area.width));
    const imageBottom = Math.min(image.height, Math.ceil(area.y + area.height));
    const left = corner % 2 === 0 ? imageLeft : Math.max(imageLeft, imageRight - width);
    const top = corner < 2 ? imageTop : Math.max(imageTop, imageBottom - height);
    const cropWidth = Math.min(width, imageRight - left);
    const cropHeight = Math.min(height, imageBottom - top);
    if (cropWidth < 80 || cropHeight < 80) return null;

    const crop = new Uint8ClampedArray(cropWidth * cropHeight);
    for (let y = 0; y < cropHeight; y++) {
        const start = (top + y) * image.width + left;
        crop.set(luminance.subarray(start, start + cropWidth), y * cropWidth);
    }
    return decodeRotatedLuminance(crop, cropWidth, cropHeight, [0, 45, 90, 135, 180, 225, 270, 315]);
}

export function decodeBookBarcode(image: PixelImage, bookArea?: BarcodeSearchArea): string | null {
    if (image.data.length !== image.width * image.height * 4) {
        throw new Error("Invalid barcode image dimensions.");
    }
    const luminance = new Uint8ClampedArray(image.width * image.height);
    for (let i = 0; i < luminance.length; i++) {
        const offset = i * 4;
        luminance[i] = (306 * image.data[offset] + 601 * image.data[offset + 1] +
            117 * image.data[offset + 2] + 512) >> 10;
    }

    const fullFrameBarcode = decodeRotatedLuminance(luminance, image.width, image.height, [0, 90, 180, 270]);
    if (fullFrameBarcode || !bookArea) return fullFrameBarcode;

    for (let corner = 0; corner < 4; corner++) {
        const barcode = decodeBookCorner(image, luminance, bookArea, corner);
        if (barcode) return barcode;
    }
    return null;
}

export function decodeBookBarcodeInQuadrilateral(image: PixelImage, corners: BarcodeQuadrilateral): string | null {
    if (image.width <= 0 || image.height <= 0 || image.data.length !== image.width * image.height * 4) {
        throw new Error("Invalid barcode image dimensions.");
    }
    if (corners.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
        point.x < 0 || point.y < 0 || point.x >= image.width || point.y >= image.height)) {
        throw new Error("Barcode selection is outside the image.");
    }
    const turns = corners.map((point, index) => {
        const next = corners[(index + 1) % corners.length];
        const afterNext = corners[(index + 2) % corners.length];
        return (next.x - point.x) * (afterNext.y - next.y) -
            (next.y - point.y) * (afterNext.x - next.x);
    });
    if (!turns.every(turn => turn > 0) && !turns.every(turn => turn < 0)) {
        throw new Error("Barcode selection must be a convex quadrilateral.");
    }
    const edgeLength = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        Math.hypot(b.x - a.x, b.y - a.y);
    const width = Math.round((edgeLength(corners[0], corners[1]) + edgeLength(corners[2], corners[3])) / 2);
    const height = Math.round((edgeLength(corners[1], corners[2]) + edgeLength(corners[3], corners[0])) / 2);
    if (width < 80 || height < 80) return null;

    const outputCorners: MatMarkers = [
        { x: 0, y: 0 }, { x: width - 1, y: 0 },
        { x: width - 1, y: height - 1 }, { x: 0, y: height - 1 }
    ];
    const mapToImage = perspectiveTransform(outputCorners, corners);
    const luminance = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const source = mapToImage({ x, y });
            const sx = Math.round(source.x), sy = Math.round(source.y);
            const offset = (sy * image.width + sx) * 4;
            luminance[y * width + x] = (306 * image.data[offset] + 601 * image.data[offset + 1] +
                117 * image.data[offset + 2] + 512) >> 10;
        }
    }
    return decodeRotatedLuminance(luminance, width, height, [0, 45, 90, 135, 180, 225, 270, 315]);
}
