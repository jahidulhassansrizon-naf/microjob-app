"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import {
  LIVE_DOM_CHUNK_BYTES, LIVE_DOM_EVENTS_TOPIC, LIVE_DOM_CONTROL_TOPIC, LIVE_DOM_MAX_BATCH_BYTES,
  liveDomBytesToBase64, liveDomChecksum,
} from "@/lib/liveDomProtocol";
import { Check, MonitorUp, X } from "lucide-react";

type ScreenShareRequest = { requestId: string; viewerId: string };
type ShareState = "idle" | "requested" | "sharing" | "declined" | "stopped";

const SESSION_KEY = "sohojhub:presence-session-id";
type WebsiteDomRecorder = { stop: () => void; refresh: () => void };

function getCredentials() {
  try {
    const token = window.localStorage.getItem("token") || "";
    const rawUser = window.localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (!token || user?.role === "admin") return null;
    return { Authorization: `Bearer ${token}` };
  } catch {
    return null;
  }
}

function getSessionId() {
  try {
    const value = window.sessionStorage.getItem(SESSION_KEY) || "";
    return /^[a-zA-Z0-9._:-]{16,120}$/.test(value) ? value : "";
  } catch {
    return "";
  }
}

function safeJson(payload: Uint8Array | string): any {
  try {
    return JSON.parse(typeof payload === "string" ? payload : new TextDecoder().decode(payload));
  } catch {
    return null;
  }
}

function sanitizeRrwebEvent(event: any) {
  if (event?.type !== 4 || typeof event?.data?.href !== "string") return event;
  try {
    const url = new URL(event.data.href, window.location.href);
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (/(token|password|passwd|secret|otp|auth|session|api[_-]?key|access[_-]?key)/i.test(key)) {
        url.searchParams.set(key, "[redacted]");
      }
    }
    return { ...event, data: { ...event.data, href: url.toString() } };
  } catch {
    return { ...event, data: { ...event.data, href: window.location.origin + window.location.pathname } };
  }
}

async function publishRrwebBatch(
  room: Room,
  request: ScreenShareRequest,
  batchNo: number,
  events: unknown[],
  preferredEncoding: "identity" | "gzip",
) {
  const serialized = JSON.stringify({ version: 1, kind: "rrweb-batch", requestId: request.requestId, batchNo, events });
  const rawBytes = new TextEncoder().encode(serialized);
  if (rawBytes.byteLength > LIVE_DOM_MAX_BATCH_BYTES) {
    throw new Error("লাইভ পেজের DOM snapshot 8 MiB সীমা অতিক্রম করেছে। ভারী/অপ্রয়োজনীয় পেজ কনটেন্ট বাদ দিয়ে আবার চেষ্টা করুন।");
  }

  // Negotiate gzip only when the admin has confirmed decompression support.
  // If a completed batch cannot be decoded, the admin can request an identity-only
  // retry, keeping compression for the normal (faster) path.
  let bytes = rawBytes;
  let encoding: "identity" | "gzip" = "identity";
  if (preferredEncoding === "gzip" && rawBytes.byteLength > 4096 && typeof CompressionStream !== "undefined") {
    try {
      const stream = new Blob([rawBytes]).stream().pipeThrough(new CompressionStream("gzip"));
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
      if (compressed.byteLength > 0 && compressed.byteLength < rawBytes.byteLength) {
        bytes = compressed;
        encoding = "gzip";
      }
    } catch {
      // Keep identity encoding if compression is unavailable at runtime.
    }
  }

  // Small bounded chunks keep each reliable LiveKit data packet under its size limit.
  const total = Math.max(1, Math.ceil(bytes.byteLength / LIVE_DOM_CHUNK_BYTES));
  const messageId = typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const destination = [`admin-${request.viewerId}`];
  const checksum = liveDomChecksum(bytes);

  for (let index = 0; index < total; index += 1) {
    const chunk = bytes.subarray(index * LIVE_DOM_CHUNK_BYTES, Math.min(bytes.byteLength, (index + 1) * LIVE_DOM_CHUNK_BYTES));
    const packet = {
      version: 1,
      kind: "rrweb-chunk",
      encoding,
      requestId: request.requestId,
      messageId,
      index,
      total,
      byteLength: bytes.byteLength,
      checksum,
      payload: liveDomBytesToBase64(chunk),
    };
    const publishing = room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(packet)), {
      reliable: true,
      topic: LIVE_DOM_EVENTS_TOPIC,
      destinationIdentities: destination,
    });
    publishing.catch(() => { /* handled through the race below */ });
    let timer: number | undefined;
    try {
      await Promise.race([
        publishing,
        new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(new Error("লাইভ ডেটা পাঠাতে বেশি সময় লাগছে।")), 15_000); }),
      ]);
    } finally {
      if (timer !== undefined) window.clearTimeout(timer);
    }
  }
}

async function createWebsiteDomRecorder(
  room: Room,
  request: ScreenShareRequest,
  onError: (error: Error) => void,
  getPreferredEncoding: () => "identity" | "gzip",
): Promise<WebsiteDomRecorder> {
  const { record } = await import("@rrweb/record");
  let active = true;
  let stopRecording: (() => void) | undefined;
  let flushTimer: number | null = null;
  let nextBatchNo = 0;
  let queue: unknown[] = [];
  let sendChain: Promise<void> = Promise.resolve();
  let reportedError = false;
  let restarting = false;
  let lastRefreshAt = 0;
  let refreshTimer: number | null = null;
  let failures = 0;
  let lastSentBatch = -1;
  let heartbeat: number | null = null;

  // Tiny best-effort control message (not queued behind big batches).
  const sendControl = (payload: Record<string, unknown>) => {
    void room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ version: 1, requestId: request.requestId, ...payload })),
      { reliable: true, topic: LIVE_DOM_CONTROL_TOPIC, destinationIdentities: [`admin-${request.viewerId}`] },
    ).catch(() => { /* heartbeat is optional */ });
  };

  // A transient send problem must never freeze the mirror: drop the backlog and resync
  // with a fresh snapshot. Only repeated failures end the session.
  const fail = (cause: unknown) => {
    if (!active) return;
    failures += 1;
    if (failures >= 4) {
      if (!reportedError) {
        reportedError = true;
        onError(cause instanceof Error ? cause : new Error("লাইভ DOM ডেটা পাঠানো যায়নি।"));
      }
      return;
    }
    refresh();
  };

  const flush = () => {
    flushTimer = null;
    if (!active || restarting || queue.length === 0) return;
    pendingAttrs.clear();
    const events = queue.splice(0, 300);
    const batchNo = nextBatchNo++;
    sendChain = sendChain
      .then(() => publishRrwebBatch(room, request, batchNo, events, getPreferredEncoding()))
      .then(() => { failures = 0; lastSentBatch = batchNo; })
      .catch(fail);
    if (queue.length > 0) flushTimer = window.setTimeout(flush, 20);
  };

  // Animations change the same attribute (e.g. style) dozens of times per second. Inside one
  // send window only the newest value matters, so merge into the earlier queued event in place.
  // Order is preserved and nothing is ever dropped for nodes that are added/removed.
  const pendingAttrs = new Map<string, Record<string, any>>();
  const coalesce = (event: any): boolean => {
    const d = event?.data;
    if (event?.type !== 3 || d?.source !== 0 || d.adds?.length || d.removes?.length || d.texts?.length || !Array.isArray(d.attributes)) return false;
    const kept: any[] = [];
    for (const entry of d.attributes) {
      const rest: Record<string, any> = {};
      for (const [name, value] of Object.entries(entry?.attributes || {})) {
        const stored = pendingAttrs.get(`${entry.id}|${name}`);
        if (stored) {
          const prev = stored[name];
          stored[name] = name === "style" && prev && typeof prev === "object" && value && typeof value === "object"
            ? { ...(prev as object), ...(value as object) } : value;
        } else rest[name] = value;
      }
      if (Object.keys(rest).length > 0) {
        kept.push({ ...entry, attributes: rest });
        for (const name of Object.keys(rest)) pendingAttrs.set(`${entry.id}|${name}`, rest);
      }
    }
    if (kept.length === 0) return true; // fully merged into an earlier queued event
    d.attributes = kept;
    return false;
  };

  const queueEvent = (event: any) => {
    if (!active || restarting) return;
    if (queue.length >= 1500) { refresh(); return; } // backlog => resync instead of lagging behind
    const clean = sanitizeRrwebEvent(event);
    if (coalesce(clean)) return;
    queue.push(clean);
    // First batch immediately; afterwards ~10 batches/second keeps CPU and network low.
    if (flushTimer === null) flushTimer = window.setTimeout(flush, nextBatchNo === 0 ? 0 : 30);
  };

  // rrweb sends DOM mutations and interactions, not pixels. Sensitive elements are masked at source.
  const recorderOptions = {
    emit: queueEvent,
    blockSelector: "[data-live-view-ignore], [data-live-view-sensitive]",
    maskTextSelector: "[data-live-view-sensitive]",
    maskAllInputs: true,
    sampling: { mousemove: 40, scroll: 60, input: "last" as const },
    slimDOMOptions: {
      script: true, comment: true, headFavicon: true, headWhitespace: true,
      headMetaSocial: true, headMetaRobots: true, headMetaHttpEquiv: true,
      headMetaVerification: true, headMetaAuthorship: true, headMetaDescKeywords: true,
    },
    recordCanvas: false,
    inlineStylesheet: true,
  };
  const beginRecording = () => { stopRecording = record(recorderOptions); };

  const doRefresh = () => {
    refreshTimer = null;
    if (!active) return;
    lastRefreshAt = Date.now();
    try { stopRecording?.(); } catch { /* already stopped */ }
    stopRecording = undefined;
    // Wait for any in-flight batch so old batches never arrive after the new snapshot.
    sendChain = sendChain.then(() => {
      if (!active) return;
      restarting = false;
      beginRecording();
    }).catch(() => { restarting = false; });
  };
  const refresh = () => {
    if (!active) return;
    restarting = true;
    queue = [];
    pendingAttrs.clear();
    if (flushTimer !== null) { window.clearTimeout(flushTimer); flushTimer = null; }
    if (refreshTimer !== null) return; // a resync is already scheduled
    refreshTimer = window.setTimeout(doRefresh, Math.max(0, 3000 - (Date.now() - lastRefreshAt)));
  };

  beginRecording();
  heartbeat = window.setInterval(() => sendControl({ kind: "hb", sent: lastSentBatch, queued: queue.length }), 2000);

  const stop = () => {
    if (!active) return;
    active = false;
    if (flushTimer !== null) window.clearTimeout(flushTimer);
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    if (heartbeat !== null) window.clearInterval(heartbeat);
    flushTimer = null; refreshTimer = null; heartbeat = null;
    try { stopRecording?.(); } catch { /* already stopped */ }
    queue = [];
  };
  return { stop, refresh };
}

export default function LiveScreenShareController() {
  const [pendingRequest, setPendingRequest] = useState<ScreenShareRequest | null>(null);
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [notice, setNotice] = useState("");
  const [isBangla, setIsBangla] = useState(false);
  const [starting, setStarting] = useState(false);
  const requestRef = useRef<ScreenShareRequest | null>(null);
  const roomRef = useRef<Room | null>(null);
  const rendererStopRef = useRef<(() => void) | null>(null);
  const recorderRefreshRef = useRef<(() => void) | null>(null);
  const pollBusyRef = useRef(false);
  const shareStateRef = useRef<ShareState>("idle");
  const startingRef = useRef(false);

  const setStatus = useCallback((next: ShareState) => {
    shareStateRef.current = next;
    setShareState(next);
  }, []);

  const postResponse = useCallback(async (action: "started" | "declined" | "stopped", request = requestRef.current) => {
    const sessionId = getSessionId();
    const auth = getCredentials();
    if (!sessionId || !auth || !request) return false;
    try {
      const response = await fetch("/api/auth/presence/screen-share", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ sessionId, requestId: request.requestId, viewerId: request.viewerId, action }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const disposeRoom = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    const stopRecorder = rendererStopRef.current;
    rendererStopRef.current = null;
    recorderRefreshRef.current = null;
    if (stopRecorder) {
      try { stopRecorder(); } catch { /* already stopped */ }
    }
    if (room) {
      try { await room.disconnect(); } catch { /* already disconnected */ }
    }
  }, []);

  const stopLocalShare = useCallback(async (notifyServer: boolean) => {
    const request = requestRef.current;
    await disposeRoom();
    requestRef.current = null;
    setPendingRequest(null);
    setStatus("stopped");
    setStarting(false);
    startingRef.current = false;
    setNotice("ওয়েবসাইটের লাইভ ভিউ বন্ধ হয়েছে।");
    if (notifyServer && request) await postResponse("stopped", request);
  }, [disposeRoom, postResponse, setStatus]);

  const startScreenShare = useCallback(async () => {
    const request = requestRef.current;
    const sessionId = getSessionId();
    const auth = getCredentials();
    if (!request || !sessionId || !auth || startingRef.current || shareStateRef.current === "sharing") return;

    startingRef.current = true;
    setStarting(true);
    // Dismiss the consent overlay before recording starts; it is intentionally
    // excluded from the mirrored DOM and must not cover the actual page snapshot.
    setPendingRequest(null);
    setNotice("লাইভ ভিউ প্রস্তুত হচ্ছে…");
    let room: Room | null = null;
    let recorderHandle: WebsiteDomRecorder | null = null;
    let readyReceived = false;
    let preferredEncoding: "identity" | "gzip" = "identity";
    let readyError = "";
    let resolveReady: (() => void) | null = null;
    const readySignal = new Promise<void>((resolve) => { resolveReady = resolve; });
    const expectedAdmin = `admin-${request.viewerId}`;
    const onControlData = (payload: Uint8Array, participant: { identity: string } | undefined, _kind: unknown, topic?: string) => {
      if (topic !== LIVE_DOM_CONTROL_TOPIC || participant?.identity !== expectedAdmin) return;
      const data = safeJson(payload);
      if (!data || data.requestId !== request.requestId) return;
      if (data.kind === "ready") {
        // The admin advertises gzip only if its browser can decode it. The sender
        // still falls back to identity if CompressionStream is unavailable.
        // Respect the viewer's negotiated decoder support.
        preferredEncoding = data.supportsGzip === true ? "gzip" : "identity";
        if (recorderRefreshRef.current && shareStateRef.current === "sharing") {
          recorderRefreshRef.current();
        } else {
          readyReceived = true;
          resolveReady?.();
        }
      } else if (data.kind === "snapshot-needed") {
        // If the viewer reports a decode/validation problem, permanently choose
        // identity for the remainder of this room and send a fresh Meta + FullSnapshot.
        if (data.forceIdentity === true) preferredEncoding = "identity";
        if (recorderRefreshRef.current && shareStateRef.current === "sharing") {
          recorderRefreshRef.current();
        }
      } else if (data.kind === "stop") {
        readyError = "অ্যাডমিন লাইভ ভিউ বন্ধ করেছেন।";
        resolveReady?.();
        if (shareStateRef.current === "sharing") void stopLocalShare(true);
      }
    };

    try {
      const tokenResponse = await fetch("/api/livekit/token", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ sessionId, requestId: request.requestId, viewerId: request.viewerId }),
      });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !tokenData?.token || !tokenData?.serverUrl) {
        throw new Error(tokenData?.message || "লাইভ ভিউ সার্ভারের সঙ্গে সংযোগ করা যায়নি।");
      }

      // Data-only LiveKit session: no browser screen picker, canvas video track, or video encoding.
      room = new Room({ adaptiveStream: false, dynacast: false });
      roomRef.current = room;
      room.on(RoomEvent.DataReceived, onControlData);
      room.on(RoomEvent.Disconnected, () => {
        if (startingRef.current && !readyReceived) {
          readyError = "লাইভ সেশন বন্ধ হয়েছে। আবার অনুরোধ পাঠান।";
          resolveReady?.();
        } else if (roomRef.current === room && shareStateRef.current === "sharing") {
          void stopLocalShare(true);
        }
      });
      await room.connect(String(tokenData.serverUrl), String(tokenData.token));

      // Mark the session active so the admin can join and prepare the rrweb Replayer.
      const confirmed = await postResponse("started", request);
      if (!confirmed) throw new Error("সার্ভার লাইভ সেশন নিশ্চিত করেনি। আবার চেষ্টা করুন।");

      if (!readyReceived && !readyError) {
        let timeoutId: number | null = null;
        try {
          await Promise.race([
            readySignal,
            new Promise<void>((_, reject) => {
              timeoutId = window.setTimeout(() => reject(new Error("অ্যাডমিন ভিউ প্রস্তুত হতে বেশি সময় লাগছে। আবার চেষ্টা করুন।")), 20_000);
            }),
          ]);
        } finally {
          if (timeoutId !== null) window.clearTimeout(timeoutId);
        }
      }
      if (readyError) throw new Error(readyError);
      if (!readyReceived) throw new Error("অ্যাডমিন ভিউ প্রস্তুত হয়নি। আবার চেষ্টা করুন।");

      recorderHandle = await createWebsiteDomRecorder(room, request, (error) => {
        setNotice(error.message);
        if (roomRef.current === room) void stopLocalShare(true);
      }, () => preferredEncoding);
      rendererStopRef.current = recorderHandle.stop;
      recorderRefreshRef.current = recorderHandle.refresh;

      setStatus("sharing");
      setPendingRequest(null);
      setNotice("");
    } catch (error) {
      if (recorderHandle) {
        try { recorderHandle.stop(); } catch { /* already stopped */ }
      }
      rendererStopRef.current = null;
      recorderRefreshRef.current = null;
      if (room) {
        try { room.removeAllListeners(); await room.disconnect(); } catch { /* cleanup */ }
      }
      if (roomRef.current === room) roomRef.current = null;
      void postResponse("declined", request);
      requestRef.current = null;
      setPendingRequest(null);
      setStatus("declined");
      setNotice(error instanceof Error ? error.message : "ওয়েবসাইট লাইভ ভিউ চালু করা যায়নি।");
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [postResponse, setStatus, stopLocalShare]);

  const declineRequest = useCallback(() => {
    const request = requestRef.current;
    if (request) void postResponse("declined", request);
    requestRef.current = null;
    setPendingRequest(null);
    setStatus("declined");
    setNotice("আপনি ওয়েবসাইট লাইভ ভিউয়ের অনুরোধ গ্রহণ করেননি।");
  }, [postResponse, setStatus]);

  useEffect(() => {
    setIsBangla((document.documentElement.lang || "").toLowerCase().startsWith("bn"));
    let disposed = false;

    const poll = async () => {
      if (disposed || pollBusyRef.current) return;
      const auth = getCredentials();
      const sessionId = getSessionId();
      if (!auth || !sessionId) return;
      pollBusyRef.current = true;
      try {
        const response = await fetch(`/api/auth/presence/screen-share?sessionId=${encodeURIComponent(sessionId)}`, {
          credentials: "include",
          cache: "no-store",
          headers: auth,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) return;

        const serverStatus = String(data.status || "idle") as ShareState;
        const serverRequest: ScreenShareRequest | null = data.requestId && data.viewerId
          ? { requestId: String(data.requestId), viewerId: String(data.viewerId) }
          : null;

        if (serverStatus === "requested" && serverRequest && shareStateRef.current !== "sharing") {
          if (requestRef.current?.requestId !== serverRequest.requestId) {
            requestRef.current = serverRequest;
            setPendingRequest(serverRequest);
            setNotice("");
          }
          setStatus("requested");
        } else if (serverStatus === "sharing" && shareStateRef.current !== "sharing" && !startingRef.current) {
          // If this page was reloaded while a share was active, its media track no longer
          // exists. Close the stale server-side state rather than leaving the admin viewer stuck.
          if (serverRequest) await postResponse("stopped", serverRequest);
          requestRef.current = null;
          setPendingRequest(null);
          setStatus("stopped");
          setNotice("আগের লাইভ ভিউ সংযোগটি শেষ হয়েছে। প্রয়োজনে অ্যাডমিন নতুন অনুরোধ পাঠাতে পারবেন।");
        } else if (["stopped", "declined", "idle"].includes(serverStatus) && (roomRef.current || requestRef.current)) {
          if (roomRef.current) {
            await stopLocalShare(false);
          } else {
            requestRef.current = null;
            setPendingRequest(null);
            setStatus(serverStatus as ShareState);
          }
        }
      } catch {
        // A failed poll never starts sharing. Retry on the next interval.
      } finally {
        pollBusyRef.current = false;
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 1_500);
    const handleLogout = () => { void stopLocalShare(true); };
    window.addEventListener("sohojhub:presence-stop", handleLogout);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("sohojhub:presence-stop", handleLogout);
      void disposeRoom();
    };
  }, [disposeRoom, setStatus, stopLocalShare]);

  return (
    <>
      {pendingRequest && shareState === "requested" && (
        <div data-live-view-ignore="true" className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-labelledby="live-share-title" aria-describedby="live-share-description">
          <section data-live-view-ignore="true" className="relative isolate my-auto w-full max-w-sm overflow-hidden rounded-[24px] border border-white/10 bg-[#090D1B] shadow-[0_32px_100px_-24px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.06]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent" />
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/20 bg-gradient-to-br from-indigo-400/20 via-violet-400/15 to-cyan-300/10 text-indigo-100">
                  <MonitorUp size={22} strokeWidth={1.8} />
                  <span aria-hidden="true" className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-[3px] border-[#090D1B] bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="live-share-title" className="text-base font-semibold leading-snug text-white sm:text-lg">
                    {isBangla ? "অ্যাডমিন আপনার স্ক্রিন দেখতে চাচ্ছে।" : "The admin wants to see your screen."}
                  </h2>
                  <p id="live-share-description" className="mt-0.5 text-sm text-slate-300">
                    {isBangla ? "আপনি কি অনুমতি দিবেন?" : "Do you allow it?"}
                  </p>
                </div>
              </div>

              {notice && (
                <p role="status" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-3.5 py-3 text-sm leading-5 text-rose-200">
                  {notice}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={starting} onClick={declineRequest} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/70 disabled:cursor-not-allowed disabled:opacity-50">
                  <X size={16} /> {isBangla ? "না" : "No"}
                </button>
                <button type="button" disabled={starting} onClick={() => void startScreenShare()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-wait disabled:opacity-60">
                  <Check size={17} strokeWidth={2.2} />
                  <span>{starting ? (isBangla ? "অপেক্ষা করুন…" : "Please wait…") : (isBangla ? "হ্যাঁ" : "Yes")}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {notice && !pendingRequest && shareState !== "sharing" && (
        <div data-live-view-ignore="true" className="fixed bottom-4 right-3 z-[9000] flex max-w-sm items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-lg"><span className="flex-1">{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>
      )}
    </>
  );
}
