"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crop,
  Maximize2,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { useManualEditor } from "./EditorProvider";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function CropEditor() {
  const { activePhoto, currentPreset, rotation, flipX, applyCroppedDataUrl } =
    useManualEditor();
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rect, setRect] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [imageReady, setImageReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const interaction = useRef<{
    kind: "move" | "nw" | "ne" | "sw" | "se";
    x: number;
    y: number;
    rect: typeof rect;
  } | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const skipOpenUrl = useRef<string | null>(null);

  const targetRatio = useMemo(
    () => currentPreset.widthMm / currentPreset.heightMm,
    [currentPreset],
  );

  useEffect(() => {
    if (!activePhoto) {
      setOpen(false);
      sourceUrlRef.current = null;
      return;
    }
    if (skipOpenUrl.current === activePhoto.url) {
      skipOpenUrl.current = null;
      return;
    }
    if (sourceUrlRef.current !== activePhoto.url) {
      sourceUrlRef.current = activePhoto.url;
      setOpen(true);
      setZoom(100);
      const imageRatio = activePhoto.width / activePhoto.height;
      let width = 80;
      let height = 80;
      if (imageRatio > targetRatio)
        width = clamp((targetRatio / imageRatio) * 80, 35, 90);
      else if (imageRatio < targetRatio)
        height = clamp((imageRatio / targetRatio) * 80, 35, 90);
      setRect({ x: (100 - width) / 2, y: (100 - height) / 2, width, height });
    }
  }, [activePhoto?.url, activePhoto?.width, activePhoto?.height, targetRatio]);

  useEffect(() => {
    if (!open || !activePhoto || !canvasRef.current) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current!;
      const radians = ((rotation % 360) * Math.PI) / 180;
      const swap = Math.abs(rotation % 180) === 90;
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.scale(flipX ? -1 : 1, 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();
      setImageReady(true);
    };
    img.onerror = () => setImageReady(false);
    img.src = activePhoto.url;
    return () => {
      cancelled = true;
    };
  }, [open, activePhoto?.url, rotation, flipX]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const current = interaction.current;
      const stage = stageRef.current;
      if (!current || !stage) return;
      const bounds = stage.getBoundingClientRect();
      const dx = ((event.clientX - current.x) / bounds.width) * 100;
      const dy = ((event.clientY - current.y) / bounds.height) * 100;
      let next = { ...current.rect };

      if (current.kind === "move") {
        next.x = clamp(current.rect.x + dx, 0, 100 - current.rect.width);
        next.y = clamp(current.rect.y + dy, 0, 100 - current.rect.height);
      } else {
        const minSize = 10;
        if (current.kind.includes("n")) {
          const newY = clamp(
            current.rect.y + dy,
            0,
            current.rect.y + current.rect.height - minSize,
          );
          next.height = current.rect.height + current.rect.y - newY;
          next.y = newY;
        }
        if (current.kind.includes("s"))
          next.height = clamp(
            current.rect.height + dy,
            minSize,
            100 - current.rect.y,
          );
        if (current.kind.includes("w")) {
          const newX = clamp(
            current.rect.x + dx,
            0,
            current.rect.x + current.rect.width - minSize,
          );
          next.width = current.rect.width + current.rect.x - newX;
          next.x = newX;
        }
        if (current.kind.includes("e"))
          next.width = clamp(
            current.rect.width + dx,
            minSize,
            100 - current.rect.x,
          );

        const ratio = targetRatio;
        const pixelW = (bounds.width * next.width) / 100;
        const desiredH = pixelW / ratio;
        const newHeightPct = (desiredH / bounds.height) * 100;
        if (newHeightPct <= 100) {
          if (current.kind.includes("n"))
            next.y = clamp(
              current.rect.y + current.rect.height - newHeightPct,
              0,
              100 - newHeightPct,
            );
          next.height = clamp(newHeightPct, minSize, 100 - next.y);
        }
      }
      setRect(next);
    };
    const onPointerUp = () => {
      interaction.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [targetRatio]);

  const startInteraction = (
    event: ReactPointerEvent,
    kind: "move" | "nw" | "ne" | "sw" | "se",
  ) => {
    event.preventDefault();
    event.stopPropagation();
    interaction.current = {
      kind,
      x: event.clientX,
      y: event.clientY,
      rect: { ...rect },
    };
  };

  const resetCrop = () => {
    if (!activePhoto) return;
    const imageRatio = activePhoto.width / activePhoto.height;
    let width = 80;
    let height = 80;
    if (imageRatio > targetRatio)
      width = clamp((targetRatio / imageRatio) * 80, 35, 90);
    else if (imageRatio < targetRatio)
      height = clamp((imageRatio / targetRatio) * 80, 35, 90);
    setRect({ x: (100 - width) / 2, y: (100 - height) / 2, width, height });
    setZoom(100);
  };

  const applyCrop = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageReady) return;
    setBusy(true);
    try {
      const sx = Math.round((rect.x / 100) * canvas.width);
      const sy = Math.round((rect.y / 100) * canvas.height);
      const sw = Math.max(1, Math.round((rect.width / 100) * canvas.width));
      const sh = Math.max(1, Math.round((rect.height / 100) * canvas.height));
      const out = document.createElement("canvas");
      out.width = sw;
      out.height = sh;
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = out.toDataURL("image/png");
      const newUrl = await applyCroppedDataUrl(dataUrl, "cropped-photo.png");
      skipOpenUrl.current = newUrl;
      sourceUrlRef.current = newUrl;
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (!open || !activePhoto) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black text-white">
      <div className="h-14 shrink-0 bg-white text-gray-900 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#FF9300] text-white flex items-center justify-center">
            <Crop size={18} />
          </div>
          <div>
            <div className="text-sm font-black">সহজকাজ</div>
            <div className="text-[9px] uppercase tracking-widest text-gray-400">
              Crop &amp; Rotate Image
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-9 w-9 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-[1000px] max-h-[72vh] w-[min(900px,88vw)] flex items-center justify-center">
          <div
            ref={stageRef}
            className="relative flex items-center justify-center bg-[#101010] rounded-2xl overflow-hidden origin-center"
            style={{
              width: "100%",
              aspectRatio: `${rotation % 180 === 0 ? activePhoto.width : activePhoto.height} / ${rotation % 180 === 0 ? activePhoto.height : activePhoto.width}`,
              transform: `scale(${zoom / 100})`,
              transition: "transform 80ms linear",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
            />
            {!imageReady && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                Preparing image…
              </div>
            )}
            {imageReady && (
              <>
                <div className="absolute inset-0 pointer-events-none bg-black/45" />
                <div
                  className="absolute pointer-events-auto border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.7)]"
                  style={{
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.width}%`,
                    height: `${rect.height}%`,
                  }}
                  onPointerDown={(e) => startInteraction(e, "move")}
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-x-1/3 top-0 bottom-0 border-x border-white/40" />
                    <div className="absolute inset-y-1/3 left-0 right-0 border-y border-white/40" />
                  </div>
                  {(["nw", "ne", "sw", "se"] as const).map((handle) => {
                    const pos = {
                      nw: "left-[-6px] top-[-6px]",
                      ne: "right-[-6px] top-[-6px]",
                      sw: "left-[-6px] bottom-[-6px]",
                      se: "right-[-6px] bottom-[-6px]",
                    }[handle];
                    return (
                      <div
                        key={handle}
                        onPointerDown={(e) => startInteraction(e, handle)}
                        className={`absolute ${pos} h-3 w-3 rounded-sm border-2 border-white bg-[#FF9300] cursor-${handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize"}`}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="h-16 shrink-0 bg-white text-gray-900 border-t flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => clamp(z - 10, 100, 300))}
            className="h-10 w-10 rounded-lg border flex items-center justify-center"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="h-10 min-w-16 px-3 rounded-lg border flex items-center justify-center text-xs font-black">
            {zoom}%
          </div>
          <button
            type="button"
            onClick={() => setZoom((z) => clamp(z + 10, 100, 300))}
            className="h-10 w-10 rounded-lg border flex items-center justify-center"
          >
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="h-10 px-3 rounded-lg border text-xs font-black"
          >
            Reset
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCrop}
            className="h-10 px-4 rounded-lg border text-xs font-black flex items-center gap-2"
          >
            <Maximize2 size={14} /> Reset crop
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 px-4 rounded-lg border text-xs font-black"
          >
            No Crop Needed
          </button>
          <button
            type="button"
            disabled={busy || !imageReady}
            onClick={() => void applyCrop()}
            className="h-10 px-5 rounded-lg bg-[#FF9300] text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={14} />
            {busy ? "Cropping…" : "Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
