"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

/**
 * Shared bits of the "send a photo in the support chat" feature
 * (user dashboard chat, floating user chat, admin chat panel).
 * Photos are deleted by the server 2 minutes after they were sent; the UI mirrors that
 * with a countdown and removes the message from the screen at the same moment.
 */

export type ChatImageInfo = {
  id: string;
  mime: string;
  /** Milliseconds left when the message was received from the server. */
  remainingMs: number;
  /** Local clock deadline (set by stampImageDeadlines). */
  expiresAtLocal?: number;
};

type WithImage = { id: string; image?: ChatImageInfo };

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_SIDE = 1600;

/** Call on every batch of messages received from the API. */
export function stampImageDeadlines<T extends WithImage>(messages: T[]): T[] {
  const now = Date.now();
  return messages.map((message) =>
    message.image
      ? { ...message, image: { ...message.image, expiresAtLocal: now + message.image.remainingMs } }
      : message,
  );
}

/** Removes photo messages from the screen the moment their 2 minutes are over. */
export function useImageExpiry<T extends WithImage>(
  setMessages: Dispatch<SetStateAction<T[]>>,
  onExpired?: (ids: string[]) => void,
) {
  const callbackRef = useRef(onExpired);
  callbackRef.current = onExpired;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessages((current) => {
        const now = Date.now();
        const gone = current.filter(
          (message) => message.image && (message.image.expiresAtLocal ?? Infinity) <= now,
        );
        if (!gone.length) return current;
        const goneIds = gone.map((message) => message.id);
        queueMicrotask(() => callbackRef.current?.(goneIds));
        return current.filter((message) => !goneIds.includes(message.id));
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [setMessages]);
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ছবিটি পড়া যায়নি।"));
    };
    img.src = url;
  });
}

/** Checks the file and shrinks big photos / screenshots so they upload fast. */
export async function prepareImageForChat(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("শুধু ছবি পাঠানো যাবে।");
  // Animated GIFs are sent as they are.
  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("ছবির সাইজ সর্বোচ্চ ৩ MB হতে পারবে।");
    return file;
  }

  const bitmap = await loadBitmap(file);
  const width = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const height = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  if (scale === 1 && file.size <= 1_500_000 && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
    if ("close" in bitmap) bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ছবিটি প্রসেস করা যায়নি।");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if ("close" in bitmap) bitmap.close();

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("ছবিটি প্রসেস করা যায়নি।");
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("ছবির সাইজ সর্বোচ্চ ৩ MB হতে পারবে।");
  return new File([blob], "chat-photo.jpg", { type: "image/jpeg" });
}

/** Uploads the photo; resolves with the new chat message (deadline already stamped). */
export async function uploadChatImage<T extends WithImage>(
  url: string,
  file: File,
  extraFields?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(extraFields || {})) form.append(key, value);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: getClientAuthHeaders(),
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success || !data?.message) {
    throw new Error(typeof data?.message === "string" ? data.message : "ছবি পাঠানো যায়নি।");
  }
  return stampImageDeadlines([data.message as T])[0];
}

function dragHasFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types || []).includes("Files");
}

/** Drag & drop + paste (screenshots) support for a chat box. */
export function useImageDrop(onFile: (file: File) => void, disabled = false) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const pickImage = (files?: FileList | null) =>
    Array.from(files || []).find((file) => file.type.startsWith("image/")) || null;

  return {
    dragging: dragging && !disabled,
    bind: {
      onDragEnter: (event: DragEvent<HTMLElement>) => {
        if (!dragHasFiles(event)) return;
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (dragHasFiles(event)) event.preventDefault();
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!dragHasFiles(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!dragHasFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setDragging(false);
        const file = pickImage(event.dataTransfer?.files);
        if (file && !disabled) onFile(file);
      },
      onPaste: (event: ClipboardEvent<HTMLElement>) => {
        const file = pickImage(event.clipboardData?.files);
        if (!file) return;
        event.preventDefault();
        if (!disabled) onFile(file);
      },
    },
  };
}

/** "Drop the photo here" cover shown while a file is dragged over the chat. */
export function ChatDropOverlay({ show, rounded = "rounded-xl" }: { show: boolean; rounded?: string }) {
  if (!show) return null;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#DC2626] bg-[#FBF6E8]/90 text-center ${rounded}`}
    >
      <ImagePlus size={28} className="text-[#DC2626]" />
      <span className="text-sm font-bold text-[#3B2F1E]">ছবিটি এখানে ছেড়ে দিন</span>
      <span className="text-[11px] text-[#7A6A50]">২ মিনিট পর অটো ডিলিট হয়ে যাবে</span>
    </div>
  );
}

/** Small button that opens the file picker. */
export function ChatImagePicker({
  onFile,
  disabled,
  uploading,
  className,
  iconSize = 16,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
  className?: string;
  iconSize?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="ছবি পাঠান"
        title="ছবি পাঠান (২ মিনিট পর মুছে যাবে)"
        className={className}
      >
        {uploading ? <LoaderCircle size={iconSize} className="animate-spin" /> : <ImagePlus size={iconSize} />}
      </button>
    </>
  );
}

/** The photo inside a chat bubble, with a "deletes in m:ss" countdown and tap-to-enlarge. */
export function ChatImageBubble({ image, tone = "light" }: { image: ChatImageInfo; tone?: "light" | "dark" }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.ceil(((image.expiresAtLocal ?? Date.now() + image.remainingMs) - Date.now()) / 1000)),
  );

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    setSrc("");
    setFailed(false);
    fetch(`/api/chat/image/${encodeURIComponent(image.id)}`, {
      credentials: "include",
      cache: "no-store",
      headers: getClientAuthHeaders(),
    })
      .then((response) => {
        if (!response.ok) throw new Error("gone");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.id]);

  useEffect(() => {
    const deadline = image.expiresAtLocal ?? Date.now() + image.remainingMs;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [image.expiresAtLocal, image.remainingMs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const muted = tone === "dark" ? "text-white/80" : "text-slate-500";

  return (
    <div className="w-[190px] max-w-full">
      {failed ? (
        <div className={`flex h-24 items-center justify-center rounded-lg border border-dashed border-current/30 px-2 text-center text-[12px] ${muted}`}>
          ছবিটি মুছে গেছে
        </div>
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Chat photo"
          onClick={() => setOpen(true)}
          className="max-h-56 w-full cursor-zoom-in rounded-lg bg-black/5 object-contain"
        />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg bg-black/5">
          <LoaderCircle size={18} className={`animate-spin ${muted}`} />
        </div>
      )}
      <p className={`mt-1 text-[10px] ${muted}`}>
        ⏱ {minutes}:{seconds} পরে অটো ডিলিট
      </p>

      {open && src && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            aria-label="Close photo"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Chat photo" className="max-h-full max-w-full rounded-lg object-contain" />
          <span className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            ⏱ {minutes}:{seconds} পরে অটো ডিলিট
          </span>
        </div>
      )}
    </div>
  );
}
