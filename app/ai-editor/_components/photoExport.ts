export const EXPORT_DPI = 300;
export type PhysicalSize = {
    width: number;
    height: number;
    unit: "mm" | "in";
};
export function parsePhysicalSizeLabel(label: string): PhysicalSize {
    const normalized = String(label || "").trim();
    const inchMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*inch/i);
    if (inchMatch) {
        return {
            width: Number(inchMatch[1]),
            height: Number(inchMatch[2]),
            unit: "in",
        };
    }
    const mmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*mm/i);
    if (mmMatch) {
        return {
            width: Number(mmMatch[1]),
            height: Number(mmMatch[2]),
            unit: "mm",
        };
    }
    return {
        width: 45,
        height: 55,
        unit: "mm",
    };
}
export function isOriginalSizeLabel(label: string) {
    return /^original size$/i.test(String(label || "").trim());
}
export function getExportPhysicalSize(label: string, aspectOption: string, aspectRatio?: number): PhysicalSize {
    const base = parsePhysicalSizeLabel(label);
    if (aspectOption === "original" ||
        !aspectRatio ||
        !Number.isFinite(aspectRatio) ||
        aspectRatio <= 0) {
        return base;
    }
    return {
        width: base.width,
        height: base.width / aspectRatio,
        unit: base.unit,
    };
}
export function physicalToPixels(physical: PhysicalSize, dpi = EXPORT_DPI) {
    return {
        widthPx: Math.max(1, Math.round(physical.unit === "in"
            ? physical.width * dpi
            : (physical.width / 25.4) * dpi)),
        heightPx: Math.max(1, Math.round(physical.unit === "in"
            ? physical.height * dpi
            : (physical.height / 25.4) * dpi)),
        dpi,
    };
}
function crc32(bytes: Uint8Array): number {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
        crc ^= bytes[i];
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
        }
    }
    return (crc ^ 0xffffffff) >>> 0;
}
async function addJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
    const input = new Uint8Array(await blob.arrayBuffer());
    if (input.length < 2 || input[0] !== 0xff || input[1] !== 0xd8) {
        return blob;
    }
    const density = Math.max(1, Math.min(65535, Math.round(dpi)));
    let offset = 2;
    while (offset + 4 <= input.length) {
        if (input[offset] !== 0xff) {
            offset += 1;
            continue;
        }
        const marker = input[offset + 1];
        if (marker === 0xda || marker === 0xd9) {
            break;
        }
        if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
            offset += 2;
            continue;
        }
        const segmentLength = (input[offset + 2] << 8) | input[offset + 3];
        if (segmentLength < 2 || offset + 2 + segmentLength > input.length) {
            break;
        }
        const isJfif = marker === 0xe0 &&
            segmentLength >= 16 &&
            input[offset + 4] === 0x4a &&
            input[offset + 5] === 0x46 &&
            input[offset + 6] === 0x49 &&
            input[offset + 7] === 0x46 &&
            input[offset + 8] === 0x00;
        if (isJfif) {
            input[offset + 11] = 1;
            input[offset + 12] = (density >> 8) & 0xff;
            input[offset + 13] = density & 0xff;
            input[offset + 14] = (density >> 8) & 0xff;
            input[offset + 15] = density & 0xff;
            return new Blob([input], {
                type: "image/jpeg",
            });
        }
        offset += 2 + segmentLength;
    }
    const app0 = new Uint8Array(18);
    app0[0] = 0xff;
    app0[1] = 0xe0;
    app0[2] = 0x00;
    app0[3] = 0x10;
    app0[4] = 0x4a;
    app0[5] = 0x46;
    app0[6] = 0x49;
    app0[7] = 0x46;
    app0[8] = 0x00;
    app0[9] = 0x01;
    app0[10] = 0x02;
    app0[11] = 0x01;
    app0[12] = (density >> 8) & 0xff;
    app0[13] = density & 0xff;
    app0[14] = (density >> 8) & 0xff;
    app0[15] = density & 0xff;
    app0[16] = 0x00;
    app0[17] = 0x00;
    const output = new Uint8Array(input.length + app0.length);
    output.set(input.slice(0, 2), 0);
    output.set(app0, 2);
    output.set(input.slice(2), 2 + app0.length);
    return new Blob([output], {
        type: "image/jpeg",
    });
}
async function addPngDpi(blob: Blob, dpi: number): Promise<Blob> {
    const input = new Uint8Array(await blob.arrayBuffer());
    const pngSignature = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    if (input.length < 33 ||
        !pngSignature.every((value, index) => input[index] === value)) {
        return blob;
    }
    const ihdrType = String.fromCharCode(input[12], input[13], input[14], input[15]);
    if (ihdrType !== "IHDR") {
        return blob;
    }
    const pixelsPerMeter = Math.max(1, Math.round(dpi / 0.0254));
    const physData = new Uint8Array(9);
    physData[0] = (pixelsPerMeter >>> 24) & 0xff;
    physData[1] = (pixelsPerMeter >>> 16) & 0xff;
    physData[2] = (pixelsPerMeter >>> 8) & 0xff;
    physData[3] = pixelsPerMeter & 0xff;
    physData[4] = (pixelsPerMeter >>> 24) & 0xff;
    physData[5] = (pixelsPerMeter >>> 16) & 0xff;
    physData[6] = (pixelsPerMeter >>> 8) & 0xff;
    physData[7] = pixelsPerMeter & 0xff;
    physData[8] = 1;
    const chunkData = new Uint8Array(13);
    chunkData.set(new Uint8Array([0x70, 0x48, 0x59, 0x73]), 0);
    chunkData.set(physData, 4);
    const crc = crc32(chunkData);
    const chunk = new Uint8Array(21);
    chunk[0] = 0x00;
    chunk[1] = 0x00;
    chunk[2] = 0x00;
    chunk[3] = 0x09;
    chunk.set(chunkData, 4);
    chunk[17] = (crc >>> 24) & 0xff;
    chunk[18] = (crc >>> 16) & 0xff;
    chunk[19] = (crc >>> 8) & 0xff;
    chunk[20] = crc & 0xff;
    const insertAt = 8 + 25;
    const output = new Uint8Array(input.length + chunk.length);
    output.set(input.slice(0, insertAt), 0);
    output.set(chunk, insertAt);
    output.set(input.slice(insertAt), insertAt + chunk.length);
    return new Blob([output], {
        type: "image/png",
    });
}
export async function addDpiMetadata(blob: Blob, format: "jpg" | "png", dpi: number): Promise<Blob> {
    return format === "jpg" ? addJpegDpi(blob, dpi) : addPngDpi(blob, dpi);
}
export async function canvasToBlob(canvas: HTMLCanvasElement, format: "jpg" | "png"): Promise<Blob> {
    const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
    const quality = format === "jpg" ? 0.95 : undefined;
    let exportCanvas = canvas;
    if (format === "jpg") {
        const flattened = document.createElement("canvas");
        flattened.width = canvas.width;
        flattened.height = canvas.height;
        const context = flattened.getContext("2d");
        if (!context) {
            throw new Error("Could not create JPG export canvas.");
        }
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, flattened.width, flattened.height);
        context.drawImage(canvas, 0, 0);
        exportCanvas = flattened;
    }
    const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, mimeType, quality);
    });
    if (!blob) {
        throw new Error("Could not encode the image for export.");
    }
    return blob;
}
export function downloadBlob(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export type ExportableImage = {
    url: string;
    size?: string;
    bgColor?: string;
    dpi?: number;
    widthPx?: number;
    heightPx?: number;
    [key: string]: unknown;
};
export async function loadImageElement(src: string): Promise<HTMLImageElement> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;
    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Unable to load image for editing."));
    });
    return img;
}
/**
 * Renders a generated photo at its exact export size (no filters / crop edits).
 * Mirrors what the Recent Generations preview modal exports for an unedited photo.
 */
export async function renderPhotoToExportCanvas(image: ExportableImage) {
    const img = await loadImageElement(image.url);
    const sourceWidth = img.naturalWidth || img.width;
    const sourceHeight = img.naturalHeight || img.height;
    if (!sourceWidth || !sourceHeight)
        throw new Error("Invalid image dimensions.");
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = sourceWidth;
    sourceCanvas.height = sourceHeight;
    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx)
        throw new Error("Canvas is not supported by this browser.");
    sourceCtx.imageSmoothingEnabled = true;
    sourceCtx.imageSmoothingQuality = "high";
    sourceCtx.drawImage(img, 0, 0, sourceWidth, sourceHeight);
    const photoSizeLabel = image.size || "35×45 mm";
    const dpi = Number(image.dpi) || EXPORT_DPI;
    if (isOriginalSizeLabel(photoSizeLabel)) {
        return {
            canvas: sourceCanvas,
            widthPx: sourceCanvas.width,
            heightPx: sourceCanvas.height,
            dpi,
            physical: {
                width: (sourceCanvas.width / dpi) * 25.4,
                height: (sourceCanvas.height / dpi) * 25.4,
                unit: "mm" as const,
            },
        };
    }
    const physical = getExportPhysicalSize(photoSizeLabel, "original");
    const target = { physical, ...physicalToPixels(physical, dpi) };
    const scale = Math.min(target.widthPx / sourceCanvas.width, target.heightPx / sourceCanvas.height);
    const drawWidth = Math.max(1, Math.round(sourceCanvas.width * scale));
    const drawHeight = Math.max(1, Math.round(sourceCanvas.height * scale));
    const drawX = Math.round((target.widthPx - drawWidth) / 2);
    const drawY = Math.max(0, target.heightPx - drawHeight);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = target.widthPx;
    outputCanvas.height = target.heightPx;
    const context = outputCanvas.getContext("2d");
    if (!context)
        throw new Error("Could not create exact-size export canvas.");
    const fill = image.bgColor || "#FFFFFF";
    if (fill === "transparent") {
        context.clearRect(0, 0, target.widthPx, target.heightPx);
    }
    else {
        context.fillStyle = /^#[0-9A-F]{6}$/i.test(fill) ? fill : "#FFFFFF";
        context.fillRect(0, 0, target.widthPx, target.heightPx);
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, drawX, drawY, drawWidth, drawHeight);
    return {
        canvas: outputCanvas,
        widthPx: target.widthPx,
        heightPx: target.heightPx,
        dpi: target.dpi,
        physical: target.physical,
    };
}
export async function downloadPhotoFormat(image: ExportableImage, format: "jpg" | "png") {
    const exported = await renderPhotoToExportCanvas(image);
    const rawBlob = await canvasToBlob(exported.canvas, format);
    const finalBlob = await addDpiMetadata(rawBlob, format, exported.dpi);
    const sizeToken = image.size
        ?.replace(/[×x]/g, "x")
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "") || "photo";
    downloadBlob(finalBlob, `${sizeToken}-${exported.widthPx}x${exported.heightPx}-${exported.dpi}dpi-${Date.now()}.${format}`);
}
function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number) {
    const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    ctx.drawImage(img, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}
export async function downloadPhotoPrintSheet(image: ExportableImage) {
    const editedCanvas = await renderPhotoToExportCanvas(image).then((result) => {
        // The print sheet uses the photo as-is (no forced export size).
        return result.canvas;
    });
    const source = new Image();
    source.src = editedCanvas.toDataURL("image/png");
    await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error("Unable to build print sheet."));
    });
    const printCanvas = document.createElement("canvas");
    printCanvas.width = 1800;
    printCanvas.height = 1200;
    const ctx = printCanvas.getContext("2d");
    if (!ctx)
        throw new Error("Canvas is not supported by this browser.");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
    const cols = 4;
    const rows = 2;
    const gap = 24;
    const cellWidth = (printCanvas.width - gap * (cols + 1)) / cols;
    const cellHeight = (printCanvas.height - gap * (rows + 1)) / rows;
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const x = gap + col * (cellWidth + gap);
            const y = gap + row * (cellHeight + gap);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x, y, cellWidth, cellHeight);
            drawContain(ctx, source, x, y, cellWidth, cellHeight);
            ctx.strokeStyle = "#D1D5DB";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
    }
    const rawBlob = await canvasToBlob(printCanvas, "jpg");
    const finalBlob = await addDpiMetadata(rawBlob, "jpg", 300);
    downloadBlob(finalBlob, `print-sheet-4x6in-1800x1200-300dpi-${Date.now()}.jpg`);
}
/** Prepares the data the Print Studio needs (image data URL + physical size in mm). */
export async function buildPrintStudioPayload(image: ExportableImage) {
    const img = await loadImageElement(image.url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        throw new Error("Canvas is not supported by this browser.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    const dpi = Number(image.dpi) || 0;
    const wPx = Number(image.widthPx) || 0;
    const hPx = Number(image.heightPx) || 0;
    let widthMm: number;
    let heightMm: number;
    if (dpi > 0 && wPx > 0 && hPx > 0) {
        widthMm = (wPx / dpi) * 25.4;
        heightMm = (hPx / dpi) * 25.4;
    }
    else {
        widthMm = 100;
        heightMm = (100 * canvas.height) / Math.max(1, canvas.width);
    }
    return {
        dataUrl,
        preset: { id: "ai-photo", label: "Photo", widthMm, heightMm },
    };
}
export async function printSinglePhoto(image: ExportableImage, preExported?: { canvas: HTMLCanvasElement; physical: { width: number; height: number; unit: "mm" | "in" } }) {
    let printRoot: HTMLDivElement | null = null;
    let printStyle: HTMLStyleElement | null = null;
    let cleanupTimer: number | null = null;
    let cleanedUp = false;
    const cleanupPrintDocument = () => {
        if (cleanedUp)
            return;
        cleanedUp = true;
        if (cleanupTimer !== null) {
            window.clearTimeout(cleanupTimer);
            cleanupTimer = null;
        }
        window.removeEventListener("afterprint", cleanupPrintDocument);
        if (printRoot?.parentNode) {
            printRoot.parentNode.removeChild(printRoot);
        }
        if (printStyle?.parentNode) {
            printStyle.parentNode.removeChild(printStyle);
        }
    };
    try {
        const exported = preExported ?? await renderPhotoToExportCanvas(image);
        const imageData = exported.canvas.toDataURL("image/jpeg", 0.95);
        const unit = exported.physical.unit;
        const widthText = `${exported.physical.width}${unit}`;
        const heightText = `${exported.physical.height}${unit}`;
        printStyle = document.createElement("style");
        printStyle.setAttribute("data-sohoz-print-style", "true");
        printStyle.textContent = `
@page {
  size: ${widthText} ${heightText};
  margin: 0;
}

@media screen {
  #__sohoz_print_root {
position: fixed;
inset: 0;
z-index: 2147483647;
display: flex;
align-items: center;
justify-content: center;
padding: 24px;
background: rgba(15, 23, 42, 0.96);
  }

  #__sohoz_print_preview {
width: min(92vw, 520px);
height: min(92vh, 720px);
display: flex;
align-items: center;
justify-content: center;
background: #111827;
border-radius: 16px;
overflow: hidden;
box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }
}

@media print {
  html,
  body {
margin: 0 !important;
padding: 0 !important;
width: ${widthText} !important;
height: ${heightText} !important;
background: #fff !important;
overflow: hidden !important;
  }

  body > *:not(#__sohoz_print_root) {
display: none !important;
  }

  #__sohoz_print_root {
position: static !important;
display: block !important;
width: ${widthText} !important;
height: ${heightText} !important;
margin: 0 !important;
padding: 0 !important;
background: #fff !important;
overflow: hidden !important;
  }

  #__sohoz_print_preview {
width: ${widthText} !important;
height: ${heightText} !important;
margin: 0 !important;
padding: 0 !important;
background: #fff !important;
overflow: hidden !important;
  }

  #__sohoz_print_image {
display: block !important;
width: ${widthText} !important;
height: ${heightText} !important;
max-width: none !important;
max-height: none !important;
object-fit: fill !important;
margin: 0 !important;
padding: 0 !important;
page-break-inside: avoid !important;
break-inside: avoid !important;
  }
}
`;
        document.head.appendChild(printStyle);
        printRoot = document.createElement("div");
        printRoot.id = "__sohoz_print_root";
        printRoot.setAttribute("aria-hidden", "true");
        const printPreview = document.createElement("div");
        printPreview.id = "__sohoz_print_preview";
        const printImage = document.createElement("img");
        printImage.id = "__sohoz_print_image";
        printImage.src = imageData;
        printImage.alt = "Photo for printing";
        printImage.decoding = "sync";
        printImage.style.width = widthText;
        printImage.style.height = heightText;
        printImage.style.objectFit = "fill";
        printPreview.appendChild(printImage);
        printRoot.appendChild(printPreview);
        document.body.appendChild(printRoot);
        window.addEventListener("afterprint", cleanupPrintDocument);
        cleanupTimer = window.setTimeout(cleanupPrintDocument, 120000);
        const printImageReady = () => {
            window.setTimeout(() => {
                window.print();
            }, 50);
        };
        if (printImage.complete) {
            printImageReady();
        }
        else {
            printImage.addEventListener("load", printImageReady, { once: true });
            printImage.addEventListener("error", () => {
                cleanupPrintDocument();
                throw new Error("Unable to prepare the photo for printing.");
            }, { once: true });
        }
    }
    catch (error) {
        cleanupPrintDocument();
        console.error("Print failed:", error);
        throw error;
    }
    }
