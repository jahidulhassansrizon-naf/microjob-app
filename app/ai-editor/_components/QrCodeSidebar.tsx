"use client";

import { AiT, useAiEditorText } from "./aiEditorI18n";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, QrCode, RefreshCw, Smartphone } from "lucide-react";
import QRCode from "./qr-code-engine";
import QRErrorCorrectLevel from "./qr-code-engine/QRErrorCorrectLevel";

interface QrCodeSidebarProps {
  uploadUrl?: string;
  onPhotoReceived: (file: File) => void;
}

type UploadState = "creating" | "waiting" | "receiving" | "received" | "expired" | "error";

function LocalQrCode({ value, label }: { value: string; label: string }) {
  const qr = useMemo(() => {
    if (!value) return null;
    try {
      const instance = new QRCode(-1, QRErrorCorrectLevel.M);
      instance.addData(value);
      instance.make();
      const count = instance.getModuleCount();
      let path = "";
      for (let row = 0; row < count; row += 1) {
        for (let col = 0; col < count; col += 1) {
          if (instance.isDark(row, col)) path += `M${col + 4},${row + 4}h1v1h-1z`;
        }
      }
      return { count, path };
    } catch (error) {
      console.error("Unable to render the local upload QR code:", error);
      return null;
    }
  }, [value]);

  if (!qr) return <div className="flex h-40 w-40 items-center justify-center text-xs text-slate-500">QR code unavailable</div>;
  const extent = qr.count + 8;
  return (
    <svg viewBox={`0 0 ${extent} ${extent}`} role="img" aria-label={label} className="h-40 w-40 max-w-full rounded-lg bg-white p-1" shapeRendering="crispEdges">
      <rect width={extent} height={extent} fill="#FFFFFF" />
      <path d={qr.path} fill="#111827" />
    </svg>
  );
}

export default function QrCodeSidebar({ uploadUrl = "", onPhotoReceived }: QrCodeSidebarProps) {
  const { t } = useAiEditorText();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("creating");
  const [errorKey, setErrorKey] = useState("");
  const [justReceivedPhoto, setJustReceivedPhoto] = useState(false);
  const onPhotoReceivedRef = useRef(onPhotoReceived);
  const sessionGenerationRef = useRef(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => { onPhotoReceivedRef.current = onPhotoReceived; }, [onPhotoReceived]);

  const createSession = useCallback(async (afterPhotoReceived = false) => {
    const generation = ++sessionGenerationRef.current;
    setUploadState("creating");
    setErrorKey("");
    setJustReceivedPhoto(afterPhotoReceived);
    setSessionToken(null);
    setMobileUrl("");
    setCopied(false);

    try {
      const headers: Record<string, string> = {};
      try {
        const token = window.localStorage.getItem("token");
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // HttpOnly cookie auth is also supported by the API.
      }
      const response = await fetch("/api/ai-editor/qr-upload/session", {
        method: "POST",
        headers,
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success || typeof result.token !== "string") {
        throw new Error("session-create-failed");
      }
      if (generation !== sessionGenerationRef.current) return;
      const origin = new URL(uploadUrl || window.location.href, window.location.origin).origin;
      const nextUrl = `${origin}/ai-editor/mobile-upload/${encodeURIComponent(result.token)}`;
      setSessionToken(result.token);
      setMobileUrl(nextUrl);
      setUploadState("waiting");
    } catch {
      if (generation !== sessionGenerationRef.current) return;
      setErrorKey("Could not create a secure upload. Check your connection and subscription, then try again.");
      setUploadState("error");
    }
  }, [uploadUrl]);

  useEffect(() => {
    void createSession();
  }, [createSession]);

  useEffect(() => {
    if (!sessionToken) return;
    let stopped = false;
    let timer: number | undefined;
    let downloadStarted = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/ai-editor/qr-upload/${encodeURIComponent(sessionToken)}`, {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (response.status === 404 || response.status === 410) {
          // The old one-time link is no longer active. Replace it automatically.
          if (!stopped) void createSession();
          return;
        }
        if (!response.ok) throw new Error("status-check-failed");
        const result = await response.json().catch(() => null);
        if (result?.status === "consumed") {
          if (!stopped) void createSession(true);
          return;
        }
        if (result?.status === "uploaded" && !downloadStarted) {
          downloadStarted = true;
          if (!stopped) {
            setJustReceivedPhoto(false);
            setUploadState("receiving");
          }
          try {
            const imageResponse = await fetch(`/api/ai-editor/qr-upload/${encodeURIComponent(sessionToken)}?download=1`, {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
            });
            if (!imageResponse.ok) throw new Error("image-download-failed");
            const blob = await imageResponse.blob();
            if (!blob.size) throw new Error("empty-image");
            const encodedName = imageResponse.headers.get("x-upload-file-name") || "mobile-photo.jpg";
            let fileName = "mobile-photo.jpg";
            try { fileName = decodeURIComponent(encodedName); } catch { fileName = "mobile-photo.jpg"; }
            const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
            if (stopped) return;
            onPhotoReceivedRef.current(file);
            const consumeResponse = await fetch(`/api/ai-editor/qr-upload/${encodeURIComponent(sessionToken)}`, {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "consume" }),
            });
            if (!consumeResponse.ok) {
              // The photo is already in the editor; server-side TTL will clean up the temporary copy.
              console.warn("The QR upload was received, but its temporary server copy could not be cleared immediately.");
            }
            if (!stopped) void createSession(true);
          } catch (error) {
            console.error("Could not transfer the phone photo to the editor:", error);
            if (!stopped) {
              setErrorKey("Upload failed. Please try again.");
              setUploadState("error");
            }
          }
          return;
        }
      } catch {
        // Brief network interruptions are retried automatically until the session expires.
      }
      if (!stopped) timer = window.setTimeout(poll, 2500);
    };

    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [sessionToken, createSession]);

  const copyLink = async () => {
    if (!mounted || !mobileUrl) return;
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt(t("Copy upload link"), mobileUrl);
    }
  };

  const openUploadPage = () => {
    if (mounted && mobileUrl) window.open(mobileUrl, "_blank", "noopener,noreferrer");
  };

  const isLocalOrigin = mounted && (() => {
    try {
      const host = new URL(uploadUrl || window.location.href, window.location.origin).hostname;
      return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
    } catch { return false; }
  })();

  return (
    <aside className="w-full max-w-[280px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Smartphone size={22} className="text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold"><AiT>Upload from phone</AiT></h4>
            <p className="mt-0.5 text-[10px] leading-4 text-slate-500"><AiT>Scan this QR code with your phone to choose a photo from your gallery. The photo will appear here on your computer.</AiT></p>
          </div>
        </div>

        <div className="mb-3 flex min-h-[184px] items-center justify-center rounded-xl border border-slate-200 bg-white p-3">
          {mobileUrl && uploadState !== "creating" && uploadState !== "error" && uploadState !== "expired" ? (
            <LocalQrCode value={mobileUrl} label={t("QR code")} />
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-slate-500">
              {uploadState === "creating" ? <Loader2 size={24} className="animate-spin text-blue-600" /> : <QrCode size={34} />}
              <span className="text-center text-xs"><AiT>{uploadState === "creating" ? "Preparing secure upload..." : uploadState === "expired" ? "This QR code is no longer active. A new one is being prepared." : errorKey || "Could not create a secure upload. Check your connection and subscription, then try again."}</AiT></span>
            </div>
          )}
        </div>

        <p role="status" aria-live="polite" className="mb-3 min-h-8 text-center text-[11px] leading-4 text-slate-600">
          {uploadState === "creating" && <AiT>{justReceivedPhoto ? "Photo received. Preparing a new QR code..." : "Preparing secure upload..."}</AiT>}
          {uploadState === "waiting" && <AiT>{justReceivedPhoto ? "Photo received. A new QR code is ready for your next photo." : "Waiting for your phone..."}</AiT>}
          {uploadState === "receiving" && <AiT>Receiving photo...</AiT>}
          {uploadState === "received" && <AiT>Photo received. Continue cropping on your computer.</AiT>}
          {uploadState === "expired" && <AiT>This QR code is no longer active. A new one is being prepared.</AiT>}
          {uploadState === "error" && errorKey && <AiT>{errorKey}</AiT>}
        </p>

        {isLocalOrigin && uploadState === "waiting" && (
          <p className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-4 text-slate-600"><AiT>For local testing, use your computer's network address instead of localhost.</AiT></p>
        )}
        {uploadState === "waiting" && <p className="mb-3 text-center text-[10px] leading-4 text-slate-400"><AiT>This QR code stays active until a photo is sent and can be used once.</AiT></p>}

        {uploadState === "waiting" && (
          <div className="flex gap-2">
            <button type="button" onClick={copyLink} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-medium text-slate-800 transition hover:bg-slate-200">
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              {copied ? <AiT>Copied</AiT> : <AiT>Copy upload link</AiT>}
            </button>
            <button type="button" onClick={openUploadPage} className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50" title={t("Open upload page")} aria-label={t("Open upload page")}>
              <ExternalLink size={15} />
            </button>
          </div>
        )}

        {(uploadState === "expired" || uploadState === "error") && (
          <button type="button" onClick={() => void createSession()} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <RefreshCw size={14} /> <AiT>Create a new QR code</AiT>
          </button>
        )}
      </div>
    </aside>
  );
}
