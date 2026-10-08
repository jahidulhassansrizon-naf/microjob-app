"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";

interface QrCodeSidebarProps {
  uploadUrl?: string;
}

export default function QrCodeSidebar({ uploadUrl = "" }: QrCodeSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait until the component is mounted on the client.
  // This keeps the initial server HTML and client HTML identical.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset QR error state whenever the URL changes.
  useEffect(() => {
    setImageFailed(false);
  }, [uploadUrl]);

  const qrSrc = useMemo(() => {
    if (!mounted || !uploadUrl || imageFailed) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
      uploadUrl,
    )}`;
  }, [mounted, uploadUrl, imageFailed]);

  // IMPORTANT:
  // Before hydration finishes, keep the button disabled.
  // This prevents server/client mismatch.
  const canInteract = mounted && Boolean(uploadUrl);

  const copyLink = async () => {
    if (!canInteract || !uploadUrl) return;

    try {
      await navigator.clipboard.writeText(uploadUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      window.prompt("Copy this link:", uploadUrl);
    }
  };

  const openEditor = () => {
    if (!canInteract || !uploadUrl) return;

    window.open(uploadUrl, "_blank", "noopener,noreferrer");
  };

  const showQr = mounted && Boolean(qrSrc);

  return (
    <aside className="w-full xl:w-[280px]">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-900 p-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800">
            {showQr ? (
              <img
                src={qrSrc}
                alt="QR code"
                className="h-10 w-10 rounded-md bg-white p-0.5"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <QrCode size={24} className="text-gray-300" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold">Scan Now</h4>

            <p className="text-[10px] text-gray-400">
              Open this editor on your phone
            </p>
          </div>
        </div>

        {/* QR Preview */}
        <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
          {showQr ? (
            <img
              src={qrSrc}
              alt="Scan to open editor"
              className="mx-auto h-36 w-36 rounded-lg bg-white p-2"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-36 items-center justify-center text-gray-400">
              <QrCode size={64} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            disabled={!canInteract}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-xs font-medium text-gray-800 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <Check size={16} className="text-emerald-600" />
            ) : (
              <Copy size={16} />
            )}

            {copied ? "Copied" : "Copy link"}
          </button>

          <button
            type="button"
            onClick={openEditor}
            disabled={!canInteract}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            title="Open editor in a new tab"
            aria-label="Open editor"
          >
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
// git status
// git add .
// git commit -m "ja mon chaise tai korsi"
// git push origin main
