"use client";
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { AiT } from "./aiEditorI18n";

type ConfirmDeleteModalProps = {
  open: boolean;
  imageUrl?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  open,
  imageUrl,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="ai-editor-font fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-photo-title"
    >
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/70 bg-[#FBF6E8] shadow-[0_24px_70px_-12px_rgba(15,23,42,0.45)] animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-red-500 to-rose-600" />

        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="px-6 pb-6 pt-7 text-center">
          <div className="relative mx-auto mb-5 w-fit">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-24 w-[76px] rounded-2xl object-cover shadow-lg ring-4 ring-white"
              />
            ) : (
              <div className="h-24 w-[76px] rounded-2xl bg-stone-100 ring-4 ring-white" />
            )}
            <span className="absolute -bottom-2 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-red-500/30 ring-4 ring-white">
              <Trash2 size={18} />
            </span>
          </div>

          <h3
            id="delete-photo-title"
            className="text-xl font-bold tracking-tight text-stone-900"
          >
            <AiT>{"Delete this photo?"}</AiT>
          </h3>
          <p className="mx-auto mt-2 max-w-[300px] text-base leading-relaxed text-stone-500">
            <AiT>
              {
                "This photo will be permanently removed from your recent photos. This cannot be undone."
              }
            </AiT>
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-stone-200 bg-[#FBF6E8] py-2.5 text-base font-semibold text-stone-700 transition hover:bg-[#F6EEDB] active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            >
              <AiT>{"Keep photo"}</AiT>
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-gradient-to-b from-red-500 to-red-600 py-2.5 text-base font-semibold text-white shadow-md shadow-red-500/25 transition hover:from-red-600 hover:to-red-700 active:scale-[0.98] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <AiT>{"Yes, delete"}</AiT>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
