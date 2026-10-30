"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImageUp, Loader2, Smartphone } from "lucide-react";
import { useAiEditorText } from "../_components/aiEditorI18n";

type MobileState = "validating" | "ready" | "preparing" | "sending" | "sent" | "expired" | "used" | "error";
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function canvasToJpeg(image: HTMLImageElement, maxDimension: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    if (!originalWidth || !originalHeight || originalWidth * originalHeight > 100_000_000) {
      reject(new Error("The selected image could not be read. Please choose a JPG, PNG, or WebP photo."));
      return;
    }
    const scale = Math.min(1, maxDimension / originalWidth, maxDimension / originalHeight);
    const width = Math.max(1, Math.round(originalWidth * scale));
    const height = Math.max(1, Math.round(originalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      reject(new Error("The selected image could not be read. Please choose a JPG, PNG, or WebP photo."));
      return;
    }
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((blob) => {
      canvas.width = 0;
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error("The selected image could not be read. Please choose a JPG, PNG, or WebP photo."));
    }, "image/jpeg", quality);
  });
}

async function normalizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("The selected image could not be read. Please choose a JPG, PNG, or WebP photo.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("The selected photo is too large. Choose a photo smaller than 25 MB.");
  }
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The selected image could not be read. Please choose a JPG, PNG, or WebP photo."));
      image.src = sourceUrl;
    });
    let blob = await canvasToJpeg(image, 2400, 0.88);
    if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToJpeg(image, 1600, 0.78);
    if (blob.size > MAX_UPLOAD_BYTES) blob = await canvasToJpeg(image, 1200, 0.72);
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error("The prepared photo is too large. Please choose another image.");
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 48) || "mobile-photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export default function MobileUploadClient({ token }: { token: string }) {
  const { t } = useAiEditorText();
  const [status, setStatus] = useState<MobileState>("validating");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const previewUrlRef = useRef("");
  const selectionIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ai-editor/qr-upload/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.status === 404 || response.status === 410) {
          setStatus("expired");
        } else if (!response.ok || !data?.success) {
          setError("This upload link is invalid or expired.");
          setStatus("error");
        } else if (data.status !== "pending") {
          setStatus("used");
        } else {
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Upload failed. Please try again.");
          setStatus("error");
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    const selectionId = ++selectionIdRef.current;
    setError("");
    setSelectedFile(null);
    setStatus("preparing");
    try {
      const normalized = await normalizeImage(file);
      if (selectionId !== selectionIdRef.current) return;
      const nextPreview = URL.createObjectURL(normalized);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = nextPreview;
      setPreviewUrl(nextPreview);
      setSelectedFile(normalized);
      setStatus("ready");
    } catch (err) {
      if (selectionId !== selectionIdRef.current) return;
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStatus("error");
    }
  };

  const sendPhoto = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || status !== "ready") return;
    setStatus("sending");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      const response = await fetch(`/api/ai-editor/qr-upload/${encodeURIComponent(token)}`, {
        method: "POST",
        body: formData,
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        if (response.status === 404 || response.status === 410) {
          setStatus("expired");
          return;
        }
        if (response.status === 409) {
          setStatus("used");
          return;
        }
        throw new Error(result?.message || result?.error || "Upload failed. Please try again.");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      // Keep the selected photo ready so a temporary network failure can be retried.
      setStatus("ready");
    }
  };

  const locked = status === "validating" || status === "preparing" || status === "sending" || status === "sent" || status === "expired" || status === "used";

  return (
    <main data-mobile-upload-page="true" className="min-h-[100dvh] w-full bg-[#FBF6E8] px-4 py-5 text-stone-900 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-5 flex items-center justify-center gap-3 text-stone-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm"><Smartphone size={23} /></div>
          <div><p className="text-sm font-medium text-stone-500">সেবা লাগবে</p><h1 className="text-xl font-bold"><span>{t("Upload a photo from your phone")}</span></h1></div>
        </div>

        <section className="w-full overflow-hidden rounded-2xl border border-stone-100 bg-[#FBF6E8] shadow-none sm:rounded-3xl">
          <div className="border-b border-stone-100 px-5 py-5 sm:px-6">
            <p className="text-base leading-6 text-stone-600">{t("Choose a photo from your gallery, then send it to the computer showing this QR code.")}</p>
            <p className="mt-2 text-sm leading-5 text-stone-400">{t("Your phone must stay on this page until the photo is sent.")}</p>
          </div>

          <form onSubmit={sendPhoto} className="space-y-4 px-5 py-5 sm:px-6">
            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-[#F6EEDB]">
                <img src={previewUrl} alt={t("Select an image from your phone's gallery.")} className="max-h-72 w-full object-contain" />
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-[#F6EEDB] px-5 py-6 text-center">
                <ImageUp size={34} className="mb-3 text-red-600" />
                <p className="text-base font-semibold text-stone-800">{t("Choose photo")}</p>
                <p className="mt-1 text-sm leading-5 text-stone-500">{t("Select an image from your phone's gallery.")}</p>
              </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" onChange={choosePhoto} className="sr-only" aria-label={t("Choose photo")} disabled={locked && status !== "preparing"} />
            {status !== "sent" && status !== "expired" && status !== "used" && (
              <button type="button" onClick={() => inputRef.current?.click()} disabled={status === "validating" || status === "preparing" || status === "sending"} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-base font-semibold text-stone-700 transition hover:bg-[#F6EEDB] disabled:cursor-not-allowed disabled:opacity-60">
                <ImageUp size={18} /> {t(previewUrl ? "Change photo" : "Choose photo")}
              </button>
            )}

            <p className="text-sm leading-5 text-stone-400">{t("Choose a JPG, PNG, or WebP image. Images are resized securely before sending.")}</p>

            {status === "validating" && <StatusLine icon={<Loader2 className="animate-spin" size={18} />} text={t("Preparing secure upload...")} />}
            {status === "preparing" && <StatusLine icon={<Loader2 className="animate-spin" size={18} />} text={t("Preparing photo...")} />}
            {status === "sending" && <StatusLine icon={<Loader2 className="animate-spin" size={18} />} text={t("Sending photo...")} />}
            {status === "sent" && <StatusLine icon={<CheckCircle2 size={20} />} text={`${t("Photo sent successfully")}. ${t("You can now continue on your computer.")}`} success />}
            {status === "expired" && <StatusLine icon={<AlertCircle size={20} />} text={t("This QR code is no longer active. Scan the current QR code on your computer.")} error />}
            {status === "used" && <StatusLine icon={<AlertCircle size={20} />} text={t("This upload link has already been used. Scan the new QR code on your computer.")} error />}
            {error && <StatusLine icon={<AlertCircle size={18} />} text={t(error)} error />}

            {status !== "sent" && status !== "expired" && status !== "used" && (
              <button type="submit" disabled={!selectedFile || status !== "ready"} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-stone-300">
                <ImageUp size={18} /> {t("Send photo")}
              </button>
            )}
          </form>
        </section>
        <p className="mt-4 text-center text-[13px] leading-5 text-stone-500">{t("Your phone must stay on this page until the photo is sent.")}</p>
      </div>
    </main>
  );
}

function StatusLine({ icon, text, success = false, error = false }: { icon: React.ReactNode; text: string; success?: boolean; error?: boolean }) {
  return <div role="status" aria-live="polite" className={`flex items-start gap-2 rounded-xl px-3 py-3 text-sm leading-5 ${success ? "bg-emerald-50 text-emerald-700" : error ? "bg-rose-50 text-rose-700" : "bg-[#F6EEDB] text-stone-600"}`}><span className="mt-0.5 shrink-0">{icon}</span><span>{text}</span></div>;
}
