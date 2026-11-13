"use client";
/**
 * Manual Editor print.
 *
 * This is the SAME Print Studio the AI Editor uses (app/ai-editor/_components/AiPrintStudioModal.tsx),
 * so custom sizes, borders, cut lines, zoom / pan, multiple sheets and PDF / direct printing work
 * exactly the same in both editors. This file only connects it to the Manual Editor.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { DPI } from "./constants";
import { useManualEditor } from "./EditorProvider";

const AiPrintStudioModal = dynamic(() => import("@/app/ai-editor/_components/AiPrintStudioModal"), { ssr: false, loading: () => null });

type PrintPreset = { id?: string; label?: string; widthMm: number; heightMm: number };

function loadSize(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
        img.onerror = () => reject(new Error("Unable to load the photo for printing."));
        img.src = src;
    });
}

/** Real physical size of a photo when only its pixels are known (300 DPI, same as the export). */
async function presetFromPixels(src: string): Promise<PrintPreset> {
    const { width, height } = await loadSize(src);
    return { id: "manual-photo", label: "Photo", widthMm: (width / DPI) * 25.4, heightMm: (height / DPI) * 25.4 };
}

export default function PrintStudioModal() {
    const { printStudioOpen, printStudioImage, printStudioPreset, closePrintStudio, generatedPhotos } = useManualEditor();
    const [derivedPreset, setDerivedPreset] = useState<PrintPreset | null>(null);

    // Only needed when the editor did not give an exact size (e.g. an old saved photo).
    useEffect(() => {
        let cancelled = false;
        setDerivedPreset(null);
        if (!printStudioOpen || !printStudioImage || printStudioPreset)
            return;
        presetFromPixels(printStudioImage)
            .then((value) => { if (!cancelled) setDerivedPreset(value); })
            .catch(() => { if (!cancelled) setDerivedPreset({ id: "manual-photo", label: "Photo", widthMm: 45, heightMm: 55 }); });
        return () => { cancelled = true; };
    }, [printStudioOpen, printStudioImage, printStudioPreset]);

    const preset = printStudioPreset ?? derivedPreset;

    // Recently saved photos can be added to the sheet with one click (same as the AI Editor).
    const recentImages = useMemo(() => generatedPhotos
        .filter((photo) => photo && typeof photo.url === "string" && photo.url)
        .map((photo) => ({ key: String(photo.url), url: String(photo.url) })), [generatedPhotos]);

    const resolveRecent = useCallback(async (key: string) => {
        const photo = generatedPhotos.find((item) => item && String(item.url) === key);
        if (!photo)
            throw new Error("ছবিটি খুঁজে পাওয়া যায়নি।");
        const response = await fetch(photo.url);
        if (!response.ok)
            throw new Error("ছবিটি লোড করা যায়নি।");
        const blob = await response.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("ছবিটি লোড করা যায়নি।"));
            reader.readAsDataURL(blob);
        });
        const dpi = Number(photo.dpi) || DPI;
        const wPx = Number(photo.widthPx) || 0;
        const hPx = Number(photo.heightPx) || 0;
        const size = wPx > 0 && hPx > 0 ? { width: wPx, height: hPx } : await loadSize(dataUrl);
        return {
            image: dataUrl,
            preset: { id: "manual-photo", label: "Photo", widthMm: (size.width / dpi) * 25.4, heightMm: (size.height / dpi) * 25.4 },
        };
    }, [generatedPhotos]);

    return (<AiPrintStudioModal open={printStudioOpen && Boolean(preset)} image={printStudioImage} preset={preset} recentImages={recentImages} onResolveRecent={resolveRecent} onClose={closePrintStudio}/>);
}
