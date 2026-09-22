"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useManualEditor } from "./EditorProvider";

type Point = {
  x: number;
  y: number;
};

function getContainedRect(
  sourceWidth: number,
  sourceHeight: number,
  containerWidth: number,
  containerHeight: number,
) {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(
    containerWidth / sourceWidth,
    containerHeight / sourceHeight,
  );
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

function waitForImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load mask image."));
    image.src = url;
  });
}

function normalizeMaskToAlpha(
  sourceData: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
) {
  let minAlpha = 255;
  let maxAlpha = 0;

  for (let index = 3; index < sourceData.length; index += 4) {
    minAlpha = Math.min(minAlpha, sourceData[index]);
    maxAlpha = Math.max(maxAlpha, sourceData[index]);
  }

  // The backend normally returns a white RGB mask whose alpha carries
  // selection strength. For legacy grayscale masks that arrive with
  // alpha=255 everywhere, use the red channel instead.
  const useAlphaChannel = minAlpha < 250 || maxAlpha < 250;

  for (let index = 0; index < sourceData.length; index += 4) {
    const alpha = useAlphaChannel ? sourceData[index + 3] : sourceData[index];

    outputData[index] = 255;
    outputData[index + 1] = 255;
    outputData[index + 2] = 255;
    outputData[index + 3] = alpha;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function ObjectMaskCanvas() {
  const {
    activePhoto,
    objectMaskDataUrl,
    objectPreview,
    objectBrushMode,
    brushSize,
    commitObjectMask,
    zoom,
    rotation,
    flipX,
  } = useManualEditor();

  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feedbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const imageRectRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const bufferScaleRef = useRef(1);
  const drawingRef = useRef(false);
  const lastImagePointRef = useRef<Point | null>(null);
  const renderVersionRef = useRef(0);
  const feedbackFadeTimerRef = useRef<number | null>(null);

  const [pointerPoint, setPointerPoint] = useState<Point | null>(null);
  const [cursorInsideImage, setCursorInsideImage] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const syncCanvasSize = useCallback(
    (
      canvas: HTMLCanvasElement,
      cssWidth: number,
      cssHeight: number,
      dpr: number,
    ) => {
      const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    },
    [],
  );

  const clearFeedback = useCallback(() => {
    const canvas = feedbackCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, Math.round(canvas.clientWidth || 1));
    const cssHeight = Math.max(1, Math.round(canvas.clientHeight || 1));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }, []);

  const prepareFeedbackCanvas = useCallback(() => {
    const host = hostRef.current;
    const canvas = feedbackCanvasRef.current;
    if (!host || !canvas) return;

    const cssWidth = Math.max(1, Math.round(host.clientWidth));
    const cssHeight = Math.max(1, Math.round(host.clientHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    syncCanvasSize(canvas, cssWidth, cssHeight, dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
  }, [syncCanvasSize]);

  const renderOverlay = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const buffer = bufferRef.current;

    if (!host || !canvas) return;

    const cssWidth = Math.max(1, Math.round(host.clientWidth));
    const cssHeight = Math.max(1, Math.round(host.clientHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    syncCanvasSize(canvas, cssWidth, cssHeight, dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (!objectPreview || !buffer) {
      return;
    }

    const rect = imageRectRef.current;
    if (rect.width <= 0 || rect.height <= 0) return;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.drawImage(buffer, rect.x, rect.y, rect.width, rect.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
    ctx.restore();
  }, [objectPreview, syncCanvasSize]);

  const rebuildMaskBuffer = useCallback(async () => {
    const host = hostRef.current;
    if (!host || !activePhoto || !objectMaskDataUrl) return;

    const currentVersion = ++renderVersionRef.current;
    const cssWidth = Math.max(1, Math.round(host.clientWidth));
    const cssHeight = Math.max(1, Math.round(host.clientHeight));
    const rect = getContainedRect(
      activePhoto.width,
      activePhoto.height,
      cssWidth,
      cssHeight,
    );

    imageRectRef.current = rect;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    bufferScaleRef.current = dpr;

    const buffer = document.createElement("canvas");
    buffer.width = Math.max(1, Math.round(rect.width * dpr));
    buffer.height = Math.max(1, Math.round(rect.height * dpr));

    const ctx = buffer.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    try {
      const maskImage = await waitForImage(objectMaskDataUrl);
      if (currentVersion !== renderVersionRef.current) return;

      ctx.clearRect(0, 0, buffer.width, buffer.height);
      ctx.drawImage(maskImage, 0, 0, buffer.width, buffer.height);

      const imageData = ctx.getImageData(0, 0, buffer.width, buffer.height);
      const normalized = new ImageData(buffer.width, buffer.height);
      normalizeMaskToAlpha(imageData.data, normalized.data);
      ctx.putImageData(normalized, 0, 0);

      bufferRef.current = buffer;
      lastImagePointRef.current = null;
      renderOverlay();
    } catch {
      if (currentVersion !== renderVersionRef.current) return;
      bufferRef.current = null;
      renderOverlay();
    }
  }, [activePhoto, objectMaskDataUrl, renderOverlay]);

  useEffect(() => {
    void rebuildMaskBuffer();
    prepareFeedbackCanvas();

    const host = hostRef.current;
    if (!host) return;

    const observer = new ResizeObserver(() => {
      void rebuildMaskBuffer();
      prepareFeedbackCanvas();
    });
    observer.observe(host);

    return () => observer.disconnect();
  }, [prepareFeedbackCanvas, rebuildMaskBuffer]);

  useEffect(() => {
    renderOverlay();
    prepareFeedbackCanvas();
  }, [renderOverlay, prepareFeedbackCanvas]);

  useEffect(() => {
    if (!objectMaskDataUrl || drawingRef.current) return;

    setFeedbackVisible(false);
    if (feedbackFadeTimerRef.current !== null) {
      window.clearTimeout(feedbackFadeTimerRef.current);
      feedbackFadeTimerRef.current = null;
    }
    clearFeedback();
  }, [objectMaskDataUrl, clearFeedback]);

  useEffect(() => {
    return () => {
      if (feedbackFadeTimerRef.current !== null) {
        window.clearTimeout(feedbackFadeTimerRef.current);
      }
    };
  }, []);

  const screenToLocalPoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ): Point | null => {
    const host = hostRef.current;
    if (!host) return null;

    const transformedRect = host.getBoundingClientRect();
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return null;

    const centerX = transformedRect.left + transformedRect.width / 2;
    const centerY = transformedRect.top + transformedRect.height / 2;

    let x = event.clientX - centerX;
    let y = event.clientY - centerY;

    // Undo CSS zoom before undoing rotation/mirroring.
    const scale = Math.max(0.01, zoom / 100);
    x /= scale;
    y /= scale;

    const radians = (-rotation * Math.PI) / 180;
    const rotatedX = x * Math.cos(radians) - y * Math.sin(radians);
    const rotatedY = x * Math.sin(radians) + y * Math.cos(radians);

    x = flipX ? -rotatedX : rotatedX;
    y = rotatedY;

    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  };

  const getImagePoint = (point: Point) => {
    const rect = imageRectRef.current;
    if (
      point.x < rect.x ||
      point.y < rect.y ||
      point.x > rect.x + rect.width ||
      point.y > rect.y + rect.height
    ) {
      return null;
    }

    return {
      x: point.x - rect.x,
      y: point.y - rect.y,
    };
  };

  const drawFeedbackStamp = (point: Point) => {
    const canvas = feedbackCanvasRef.current;
    const local = getImagePoint(point);
    if (!canvas || !local) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const x = local.x + imageRectRef.current.x;
    const y = local.y + imageRectRef.current.y;
    const radius = Math.max(1, brushSize / 2);

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    // A warm semi-transparent highlight makes the active stroke visible
    // without hiding the underlying photo or AI selection.
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    if (objectBrushMode === "erase") {
      gradient.addColorStop(0, "rgba(59,130,246,0.34)");
      gradient.addColorStop(0.62, "rgba(59,130,246,0.24)");
      gradient.addColorStop(0.88, "rgba(59,130,246,0.10)");
      gradient.addColorStop(1, "rgba(59,130,246,0)");
    } else {
      gradient.addColorStop(0, "rgba(245,158,11,0.38)");
      gradient.addColorStop(0.6, "rgba(245,158,11,0.30)");
      gradient.addColorStop(0.88, "rgba(245,158,11,0.12)");
      gradient.addColorStop(1, "rgba(245,158,11,0)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const paintFeedbackAt = (point: Point) => {
    const currentImagePoint = getImagePoint(point);
    if (!currentImagePoint) return;

    const previousImagePoint = lastImagePointRef.current;

    if (!previousImagePoint) {
      drawFeedbackStamp(point);
    } else {
      const dx = currentImagePoint.x - previousImagePoint.x;
      const dy = currentImagePoint.y - previousImagePoint.y;
      const distance = Math.hypot(dx, dy);
      const step = Math.max(1, brushSize * 0.2);
      const steps = Math.max(1, Math.ceil(distance / step));

      for (let index = 1; index <= steps; index += 1) {
        const t = index / steps;
        const interpolated: Point = {
          x:
            imageRectRef.current.x +
            lerp(previousImagePoint.x, currentImagePoint.x, t),
          y:
            imageRectRef.current.y +
            lerp(previousImagePoint.y, currentImagePoint.y, t),
        };
        drawFeedbackStamp(interpolated);
      }
    }
  };

  const paintStamp = (point: Point) => {
    const buffer = bufferRef.current;
    const local = getImagePoint(point);
    if (!buffer || !local) return;

    const ctx = buffer.getContext("2d");
    if (!ctx) return;

    const scale = bufferScaleRef.current;
    const x = local.x * scale;
    const y = local.y * scale;
    const radius = Math.max(1, (brushSize * scale) / 2);

    ctx.save();
    ctx.globalCompositeOperation =
      objectBrushMode === "erase" ? "destination-out" : "source-over";

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    if (objectBrushMode === "erase") {
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.68, "rgba(255,255,255,0.88)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.7, "rgba(255,255,255,0.98)");
      gradient.addColorStop(0.9, "rgba(255,255,255,0.50)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const paintAt = (point: Point) => {
    const currentImagePoint = getImagePoint(point);
    if (!currentImagePoint) return;

    const previousImagePoint = lastImagePointRef.current;

    if (!previousImagePoint) {
      paintStamp(point);
    } else {
      const dx = currentImagePoint.x - previousImagePoint.x;
      const dy = currentImagePoint.y - previousImagePoint.y;
      const distance = Math.hypot(dx, dy);
      const step = Math.max(1, brushSize * 0.22);
      const steps = Math.max(1, Math.ceil(distance / step));

      for (let index = 1; index <= steps; index += 1) {
        const t = index / steps;
        const interpolated: Point = {
          x:
            imageRectRef.current.x +
            lerp(previousImagePoint.x, currentImagePoint.x, t),
          y:
            imageRectRef.current.y +
            lerp(previousImagePoint.y, currentImagePoint.y, t),
        };
        paintStamp(interpolated);
      }
    }

    paintFeedbackAt(point);
    lastImagePointRef.current = currentImagePoint;
    renderOverlay();
  };

  const exportMask = async () => {
    const buffer = bufferRef.current;
    if (!buffer || !activePhoto) return null;

    const feathered = document.createElement("canvas");
    feathered.width = buffer.width;
    feathered.height = buffer.height;
    const featherCtx = feathered.getContext("2d", {
      willReadFrequently: true,
    });
    if (!featherCtx) return null;

    // Keep the manual edge soft without destroying the original AI feather.
    featherCtx.filter = `blur(${1.05 * bufferScaleRef.current}px)`;
    featherCtx.drawImage(buffer, 0, 0);
    featherCtx.filter = "none";

    const output = document.createElement("canvas");
    output.width = activePhoto.width;
    output.height = activePhoto.height;
    const outputCtx = output.getContext("2d", {
      willReadFrequently: true,
    });
    if (!outputCtx) return null;

    outputCtx.clearRect(0, 0, output.width, output.height);
    outputCtx.drawImage(feathered, 0, 0, output.width, output.height);

    const imageData = outputCtx.getImageData(0, 0, output.width, output.height);

    const normalized = new ImageData(output.width, output.height);
    for (let index = 0; index < imageData.data.length; index += 4) {
      normalized.data[index] = 255;
      normalized.data[index + 1] = 255;
      normalized.data[index + 2] = 255;
      normalized.data[index + 3] = imageData.data[index + 3];
    }

    outputCtx.putImageData(normalized, 0, 0);
    return output.toDataURL("image/png");
  };

  const setPointerFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = screenToLocalPoint(event);
    if (!point || !getImagePoint(point)) {
      setPointerPoint(null);
      setCursorInsideImage(false);
      return null;
    }

    setPointerPoint(point);
    setCursorInsideImage(true);
    return point;
  };

  const startFeedback = () => {
    if (feedbackFadeTimerRef.current !== null) {
      window.clearTimeout(feedbackFadeTimerRef.current);
      feedbackFadeTimerRef.current = null;
    }
    prepareFeedbackCanvas();
    setFeedbackVisible(true);
  };

  const finishFeedback = () => {
    setFeedbackVisible(false);

    if (feedbackFadeTimerRef.current !== null) {
      window.clearTimeout(feedbackFadeTimerRef.current);
    }

    feedbackFadeTimerRef.current = window.setTimeout(() => {
      clearFeedback();
      feedbackFadeTimerRef.current = null;
    }, 220);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = setPointerFromEvent(event);
    if (!point) return;

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastImagePointRef.current = null;
    startFeedback();
    paintAt(point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = setPointerFromEvent(event);
    if (!point) return;

    if (drawingRef.current) {
      paintAt(point);
    }
  };

  const finishStroke = async (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    }

    if (!drawingRef.current) return;

    drawingRef.current = false;
    lastImagePointRef.current = null;

    const mask = await exportMask();
    if (mask) {
      commitObjectMask(mask);
    }

    finishFeedback();
  };

  const handlePointerLeave = () => {
    if (!drawingRef.current) {
      setPointerPoint(null);
      setCursorInsideImage(false);
    }
  };

  const handlePointerCancel = async (
    event: ReactPointerEvent<HTMLCanvasElement>,
  ) => {
    await finishStroke(event);
    setPointerPoint(null);
    setCursorInsideImage(false);
  };

  if (!activePhoto) return null;

  const transform = `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scale(${zoom / 100})`;

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-30 pointer-events-none"
      style={{
        transform,
        transformOrigin: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none select-none pointer-events-auto"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      />

      <canvas
        ref={feedbackCanvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{
          opacity: feedbackVisible ? 1 : 0,
          transition: "opacity 180ms ease-out",
        }}
      />

      {cursorInsideImage && pointerPoint && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.55)]"
          style={{
            left: pointerPoint.x,
            top: pointerPoint.y,
            width: Math.max(4, brushSize),
            height: Math.max(4, brushSize),
          }}
        />
      )}
    </div>
  );
}
