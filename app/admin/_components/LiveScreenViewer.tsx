"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, LoaderCircle, MonitorPlay, ShieldCheck, Square, Video } from "lucide-react";
import { Room, RoomEvent } from "livekit-client";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import {
  LIVE_DOM_EVENTS_TOPIC,
  LIVE_DOM_CONTROL_TOPIC,
  LIVE_DOM_CHUNK_BYTES,
  LIVE_DOM_MAX_BATCH_BYTES,
  LIVE_DOM_MAX_CHUNKS,
  LIVE_DOM_MAX_DECOMPRESSED_BYTES,
  liveDomBase64ToBytes,
  liveDomChecksum,
} from "@/lib/liveDomProtocol";

type ShareStatus = "idle" | "requested" | "sharing" | "declined" | "stopped";
type SelectedSession = {
  userId: string;
  sessionId: string;
  fullName: string;
  email: string;
  screenShareStatus?: ShareStatus;
  screenShareRequestId?: string;
  screenShareAdminViewerId?: string;
} | null;
type ReplayerHandle = {
  addEvent: (event: unknown) => void;
  startLive: (baselineTime?: number) => void;
  on?: (event: string, handler: (payload: any) => void) => void;
  destroy: () => void;
};
type ChunkSet = {
  requestId: string;
  encoding: "identity" | "gzip";
  total: number;
  byteLength?: number;
  checksum?: string;
  parts: Array<string | undefined>;
  createdAt: number;
};

function getViewerId() {
  try {
    const key = "sohojhub:admin-screen-viewer-id";
    const saved = window.sessionStorage.getItem(key);
    if (saved && /^[a-zA-Z0-9._:-]{16,120}$/.test(saved)) return saved;
    const next = typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `viewer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, next);
    return next;
  } catch {
    return `viewer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function safeJson(payload: Uint8Array | string): any {
  try {
    return JSON.parse(typeof payload === "string" ? payload : new TextDecoder().decode(payload));
  } catch {
    return null;
  }
}


export default function LiveScreenViewer({ selectedSession, onChanged }: { selectedSession: SelectedSession; onChanged: () => void }) {
  const [viewerId, setViewerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewerState, setViewerState] = useState<"idle" | "requesting" | "waiting" | "connecting" | "live" | "failed">("idle");
  const [message, setMessage] = useState("");
  const [replayAspectRatio, setReplayAspectRatio] = useState(16 / 9);
  const [activeRequestId, setActiveRequestId] = useState("");
  const [liveInfo, setLiveInfo] = useState("");
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const replayHostRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const replayerRef = useRef<ReplayerHandle | null>(null);
  const shouldStayConnectedRef = useRef(false);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;
  const sessionId = selectedSession?.sessionId || "";
  const status = selectedSession?.screenShareStatus || "idle";
  const requestId = selectedSession?.screenShareRequestId || activeRequestId;

  useEffect(() => setViewerId(getViewerId()), []);
  useEffect(() => {
    setActiveRequestId("");
    setViewerState("idle");
    setMessage("");
  }, [sessionId]);

  const closeRoom = useCallback(async () => {
    shouldStayConnectedRef.current = false;
    setReplayAspectRatio(16 / 9);
    const room = roomRef.current;
    roomRef.current = null;
    const replayer = replayerRef.current;
    replayerRef.current = null;
    try { replayer?.destroy(); } catch { /* already destroyed */ }
    if (room) {
      try { await room.disconnect(); } catch { /* already disconnected */ }
    }
    if (replayHostRef.current) replayHostRef.current.innerHTML = "";
  }, []);

  const requestShare = useCallback(async () => {
    if (!selectedSession || !viewerId || busy) return;
    setBusy(true);
    setMessage("ইউজারের কাছে লাইভ DOM ভিউয়ের অনুরোধ পাঠানো হচ্ছে…");
    setViewerState("requesting");
    await closeRoom();
    try {
      const response = await fetch("/api/admin/live/screen-share/request", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ action: "request", sessionId: selectedSession.sessionId, viewerId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "লাইভ ভিউয়ের অনুরোধ পাঠানো যায়নি।");
      setActiveRequestId(String(data.requestId || ""));
      setViewerState("waiting");
      setMessage("অনুরোধ পাঠানো হয়েছে। ইউজার অনুমতি দিলে DOM ইভেন্টের মাধ্যমে পেজটি লাইভ পুনরায় রেন্ডার হবে।");
      onChangedRef.current();
    } catch (error) {
      setViewerState("failed");
      setMessage(error instanceof Error ? error.message : "লাইভ অনুরোধ ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
    }
  }, [busy, closeRoom, selectedSession, viewerId]);

  const stopViewing = useCallback(async () => {
    if (!selectedSession || !viewerId) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/live/screen-share/request", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ action: "stop", sessionId: selectedSession.sessionId, viewerId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "লাইভ সংযোগ বন্ধ করা যায়নি।");
      await closeRoom();
      setViewerState("idle");
      setMessage("লাইভ ভিউ বন্ধ করা হয়েছে।");
      onChangedRef.current();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "সংযোগ বন্ধ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  }, [closeRoom, selectedSession, viewerId]);

  useEffect(() => {
    if (!sessionId || !viewerId || status !== "sharing" || !requestId) {
      void closeRoom();
      if (status === "declined") {
        setViewerState("idle");
        setMessage("ইউজার লাইভ ভিউয়ের অনুমতি দেননি।");
      } else if (status === "stopped") {
        setViewerState("idle");
        setMessage("ইউজার বা অ্যাডমিন লাইভ ভিউ বন্ধ করেছেন।");
      } else if (status === "requested") {
        setViewerState("waiting");
      } else if (status === "idle") {
        setViewerState("idle");
      } else if (status === "sharing" && !requestId) {
        setViewerState("connecting");
        setMessage("লাইভ সেশন আইডি পাওয়ার অপেক্ষায়…");
      }
      return;
    }

    let cancelled = false;
    let room: Room | null = null;
    let replayer: ReplayerHandle | null = null;
    let firstSnapshotSeen = false;
    let ReplayerConstructor: any = null;
    let lastSnapshotRequestAt = 0;
    let snapshotRetryCount = 0;
    let consecutiveRecoveryFailures = 0;
    let lastRecoveryAt = 0;
    let firstSnapshotTimer: number | null = null;
    let replayDims: { width: number; height: number } | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let lastBatchNo = -1;
    let replayBaseline = 0;
    let clockDelta: number | null = null; // smallest (arrival - event time) seen = clock skew + best network latency
    let lastMapped = 0;
    const LIVE_BUFFER_MS = 120; // small playout buffer: keeps animation spacing smooth, adds only ~0.12s
    let needSnapshot = true;
    let lastPacketAt = Date.now();
    let lastSilentAt = 0;
    let lagBeats = 0;
    let scale = 1;
    let statTimer: number | null = null;
    const moveCursor = (x: number, y: number) => {
      const el = cursorRef.current;
      if (!el || !Number.isFinite(x) || !Number.isFinite(y)) return;
      el.style.opacity = "1";
      el.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
    };
    const chunks = new Map<string, ChunkSet>();

    // rrweb renders the page at the USER's viewport size (e.g. 1920x950). Scale that
    // wrapper down to the admin panel width, otherwise only the top-left corner is visible.
    const fitReplay = () => {
      const host = replayHostRef.current;
      if (!host || !replayDims) return;
      const wrapper = host.querySelector(".replayer-wrapper") as HTMLElement | null;
      const hostWidth = host.clientWidth;
      if (!wrapper || hostWidth <= 0) return;
      scale = hostWidth / replayDims.width;
      wrapper.style.width = `${replayDims.width}px`;
      wrapper.style.height = `${replayDims.height}px`;
      wrapper.style.transformOrigin = "top left";
      wrapper.style.transform = `scale(${scale})`;
    };
    const setReplayDims = (width: number, height: number) => {
      if (!(width > 0) || !(height > 0)) return;
      replayDims = { width, height };
      setReplayAspectRatio(width / height);
      fitReplay();
    };
    // Decompression may take longer than delivery of the next small batch; serialize
    // completed messages to preserve rrweb's strict event timestamp/order requirement.
    let processingChain: Promise<void> = Promise.resolve();
    const expectedUserIdentity = `user-${selectedSession?.userId || ""}-${sessionId.slice(0, 16)}`;

    const requestFreshSnapshot = (reason: string, forceIdentity = false) => {
      if (cancelled || !room || Date.now() - lastSnapshotRequestAt < 2500) return;
      lastSnapshotRequestAt = Date.now();
      const control = new TextEncoder().encode(JSON.stringify({
        version: 1,
        kind: "snapshot-needed",
        reason,
        requestId,
        forceIdentity,
      }));
      void room.localParticipant.publishData(control, {
        reliable: true,
        topic: LIVE_DOM_CONTROL_TOPIC,
        destinationIdentities: [expectedUserIdentity],
      }).catch((error) => {
        console.warn("Could not request live DOM snapshot:", error instanceof Error ? error.message : "publish failed");
      });
    };

    // A full dashboard snapshot may take several seconds to arrive. Measure
    // inactivity, not total transfer time, so we do not restart an in-flight transfer.
    const SNAPSHOT_IDLE_TIMEOUT_MS = 25_000;
    const scheduleSnapshotTimeout = () => {
      if (firstSnapshotTimer !== null) window.clearTimeout(firstSnapshotTimer);
      firstSnapshotTimer = window.setTimeout(() => {
        firstSnapshotTimer = null;
        if (cancelled || firstSnapshotSeen) return;
        snapshotRetryCount += 1;
        if (snapshotRetryCount > 3) {
          setViewerState("failed");
          setMessage("লাইভ DOM snapshot-এর ডেটা আসা থেমে গেছে। সংযোগ পরীক্ষা করে আবার Request live view দিন।");
          return;
        }
        setMessage("লাইভ DOM snapshot এখনও তৈরি/পাঠানো হচ্ছে। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করা হচ্ছে…");
        requestFreshSnapshot(`snapshot-idle-timeout-${snapshotRetryCount}`);
        scheduleSnapshotTimeout();
      }, SNAPSHOT_IDLE_TIMEOUT_MS);
    };

    const resetReplayer = () => {
      firstSnapshotSeen = false;
      lastBatchNo = -1;
      needSnapshot = true;
      if (firstSnapshotTimer !== null) window.clearTimeout(firstSnapshotTimer);
      firstSnapshotTimer = null;
      try { replayer?.destroy(); } catch { /* already destroyed */ }
      replayer = null;
      if (replayerRef.current) replayerRef.current = null;
      if (!replayHostRef.current || !ReplayerConstructor) return;
      replayHostRef.current.innerHTML = "";
      replayer = new ReplayerConstructor([], {
        root: replayHostRef.current,
        liveMode: true,
        pauseAnimation: false,
        mouseTail: true,
        showWarning: false,
        showDebug: false,
        triggerFocus: false,
        blockClass: "rr-block",
      }) as ReplayerHandle;
      replayerRef.current = replayer;
      // Real-time live mode: events are scheduled by rrweb's timer, so DOM mutations are
      // really applied (sync mode only queues them). Incoming timestamps are re-based
      // onto this browser's clock below, so the user's clock difference cannot delay anything.
      replayBaseline = Date.now();
      clockDelta = null;
      lastMapped = 0;
      replayer.startLive(replayBaseline);
      try { replayer.on?.("resize", (dim: any) => setReplayDims(Number(dim?.width), Number(dim?.height))); } catch { /* optional */ }
      if (typeof ResizeObserver !== "undefined" && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => fitReplay());
        resizeObserver.observe(replayHostRef.current);
      }
    };

    const requestRecovery = (reason: string, error: unknown) => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastRecoveryAt < 1500) {
        requestFreshSnapshot(reason, true);
        return;
      }
      lastRecoveryAt = now;
      consecutiveRecoveryFailures += 1;
      if (consecutiveRecoveryFailures >= 5) {
        setViewerState("failed");
        setMessage("লাইভ DOM ডেটা বারবার যাচাই করা যায়নি। সেশন বন্ধ করে নতুন Request live view দিন।");
        console.warn("Live DOM recovery stopped after repeated failures.");
        return;
      }
      const detail = error instanceof Error ? error.message : "Invalid live DOM data";
      // Do not log the payload itself; DOM events may contain sensitive page content.
      console.warn("Live DOM batch processing failed:", { reason, detail });
      try { resetReplayer(); } catch (resetError) {
        console.warn("Could not reset live DOM replay:", resetError instanceof Error ? resetError.message : "reset failed");
      }
      setViewerState("connecting");
      // Show a short, payload-free diagnostic in the UI. Previously the actual
      // failure reason existed only in DevTools, making this recovery loop opaque.
      const diagnostic = `${reason}: ${detail}`.replace(/[\r\n]+/g, " ").slice(0, 220);
      setMessage(`লাইভ DOM ডেটা যাচাই করা যায়নি (${diagnostic})। নতুন snapshot চাওয়া হচ্ছে…`);
      requestFreshSnapshot(reason, true);
      scheduleSnapshotTimeout();
    };

    const receiveData = (payload: Uint8Array, participant: { identity: string } | undefined, _kind: unknown, topic?: string) => {
      if (cancelled || participant?.identity !== expectedUserIdentity) return;
      lastPacketAt = Date.now();

      if (topic === LIVE_DOM_EVENTS_TOPIC) {
        const packet = safeJson(payload);
        if (packet?.version !== 1 || packet?.kind !== "rrweb-chunk" || packet.requestId !== requestId) return;
        const encoding = packet.encoding === "gzip" ? "gzip" : packet.encoding === "identity" ? "identity" : "";
        if (!encoding) return;
        const messageId = String(packet.messageId || "");
        const index = Number(packet.index);
        const total = Number(packet.total);
        if (!messageId || !Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > LIVE_DOM_MAX_CHUNKS || index < 0 || index >= total || typeof packet.payload !== "string") return;
        if (packet.payload.length > Math.ceil(LIVE_DOM_CHUNK_BYTES / 3) * 4) {
          requestRecovery("oversized-chunk", new Error("Live DOM chunk exceeds the allowed payload size."));
          return;
        }
        // Renew the idle deadline while valid chunks are actively arriving.
        if (!firstSnapshotSeen) scheduleSnapshotTimeout();

        // Expire partial messages so a missing chunk cannot retain memory forever.
        const now = Date.now();
        for (const [key, value] of chunks) {
          if (now - value.createdAt > 20_000) chunks.delete(key);
        }

        const packetByteLength = Number.isSafeInteger(packet.byteLength) && Number(packet.byteLength) >= 0
          ? Number(packet.byteLength) : undefined;
        const packetChecksum = typeof packet.checksum === "string" && /^[a-f0-9]{8}$/i.test(packet.checksum)
          ? packet.checksum.toLowerCase() : undefined;
        let set = chunks.get(messageId);
        if (!set) {
          // Bound memory if a corrupted stream sends incomplete messages.
          if (chunks.size >= 4) {
            const oldestKey = [...chunks.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0]?.[0];
            if (oldestKey) chunks.delete(oldestKey);
          }
          set = { requestId, encoding, total, byteLength: packetByteLength, checksum: packetChecksum, parts: Array.from({ length: total }, () => undefined), createdAt: now };
          chunks.set(messageId, set);
        }
        if (set.total !== total || set.requestId !== requestId || set.encoding !== encoding
          || (set.byteLength !== undefined && packetByteLength !== undefined && set.byteLength !== packetByteLength)
          || (set.checksum !== undefined && packetChecksum !== undefined && set.checksum !== packetChecksum)) {
          chunks.delete(messageId);
          requestRecovery("chunk-metadata-mismatch", new Error("Chunk metadata is inconsistent."));
          return;
        }
        if (set.parts[index] !== undefined && set.parts[index] !== packet.payload) {
          chunks.delete(messageId);
          requestRecovery("duplicate-chunk-mismatch", new Error("Duplicate chunk content differs."));
          return;
        }
        set.parts[index] = packet.payload;
        if (!set.parts.every((part) => typeof part === "string")) return;

        try {
          const decodedParts = set.parts.map((part) => liveDomBase64ToBytes(part!));
          const combinedSize = decodedParts.reduce((sum, part) => sum + part.byteLength, 0);
          if (combinedSize > LIVE_DOM_MAX_BATCH_BYTES) throw new Error("Live DOM batch exceeds the 8 MiB transport limit.");
          if (set.byteLength !== undefined && combinedSize !== set.byteLength) throw new Error("Live DOM batch byte length mismatch.");
          const combined = new Uint8Array(combinedSize);
          let offset = 0;
          decodedParts.forEach((part) => { combined.set(part, offset); offset += part.byteLength; });
          const encodingForMessage = set.encoding;
          const expectedChecksum = set.checksum;
          chunks.delete(messageId);
          processingChain = processingChain.then(async () => {
            if (expectedChecksum && liveDomChecksum(combined) !== expectedChecksum) {
              throw new Error("Live DOM batch checksum mismatch.");
            }
            let decodedBytes = combined;
            if (encodingForMessage === "gzip") {
              // Compatibility with an older running sender. New sender versions use
              // identity chunks, avoiding browser gzip stream failures altogether.
              if (typeof DecompressionStream === "undefined") throw new Error("এই ব্রাউজারে পুরোনো compressed DOM data খোলা যায় না।");
              const stream = new Blob([combined]).stream().pipeThrough(new DecompressionStream("gzip"));
              decodedBytes = new Uint8Array(await new Response(stream).arrayBuffer());
              if (decodedBytes.byteLength > LIVE_DOM_MAX_DECOMPRESSED_BYTES) throw new Error("Decompressed live batch exceeds size limit.");
            }
            if (cancelled) return;
            const batch = safeJson(decodedBytes);
            if (batch?.kind !== "rrweb-batch" || batch.requestId !== requestId || !Array.isArray(batch.events)) {
              throw new Error("Live DOM batch contains invalid JSON or protocol metadata.");
            }
            if (!replayer) throw new Error("Live DOM replayer is not initialized.");
            // Sequence check: a missing/failed batch would corrupt the mirror, so wait for a fresh snapshot.
            const batchNo = Number(batch.batchNo);
            const hasFull = batch.events.some((e: any) => e?.type === 2);
            if (Number.isInteger(batchNo)) {
              if (!hasFull && (needSnapshot || (lastBatchNo >= 0 && batchNo !== lastBatchNo + 1))) {
                needSnapshot = true;
                lastBatchNo = batchNo;
                requestFreshSnapshot("batch-gap");
                return;
              }
              lastBatchNo = batchNo;
              if (hasFull) needSnapshot = false;
            }
            // Re-base the user's event clock onto ours using the BEST latency seen so far (not the
            // first event, which carried the whole snapshot transfer time = the old 1-1.5s delay).
            const arrivedAt = Date.now();
            let batchMin = Infinity;
            for (const e of batch.events) {
              const t = Number(e?.timestamp);
              if (Number.isFinite(t)) batchMin = Math.min(batchMin, arrivedAt - t);
            }
            if (Number.isFinite(batchMin)) clockDelta = clockDelta === null ? batchMin : Math.min(clockDelta + 0.25, batchMin);
            let fullSnapshotInBatch = false;
            for (const event of batch.events) {
              if (!event || typeof event.type !== "number") continue;
              if (event.type === 4 && Number(event.data?.width) > 0 && Number(event.data?.height) > 0) {
                setReplayDims(Number(event.data.width), Number(event.data.height));
              }
              lastMapped = Math.max(Number(event.timestamp) + (clockDelta ?? 0) + LIVE_BUFFER_MS, replayBaseline + 1, lastMapped);
              event.timestamp = lastMapped; // keeps real spacing between events => smooth animations
              replayer.addEvent(event);
              // rrweb event type 2 is the initial/full DOM snapshot.
              if (event.type === 2 && !firstSnapshotSeen) {
                firstSnapshotSeen = true;
                fullSnapshotInBatch = true;
                if (firstSnapshotTimer !== null) window.clearTimeout(firstSnapshotTimer);
                firstSnapshotTimer = null;
                setViewerState("live");
                setMessage("");
              }
            }
            // Count a recovery as successful only once the whole snapshot batch replayed.
            if (fullSnapshotInBatch) {
              snapshotRetryCount = 0;
              consecutiveRecoveryFailures = 0;
            }
          }).catch((error) => {
            requestRecovery("batch-decode-or-replay-failed", error);
          });
        } catch (error) {
          chunks.delete(messageId);
          requestRecovery("chunk-reassembly-failed", error);
        }
        return;
      }

      if (topic === LIVE_DOM_CONTROL_TOPIC) {
        const data = safeJson(payload);
        if (data?.requestId === requestId && data?.kind === "hb") {
          // Sender reports its last completed batch; if we stay behind it, resync.
          if (firstSnapshotSeen && Number(data.sent) > lastBatchNo) {
            lagBeats += 1;
            if (lagBeats >= 3) { lagBeats = 0; requestFreshSnapshot("lagging"); }
          } else lagBeats = 0;
          return;
        }
        if (data?.requestId === requestId && data?.kind === "stop") {
          setViewerState("idle");
          setMessage("ইউজার লাইভ ভিউ বন্ধ করেছেন।");
          void closeRoom();
        }
      }
    };

    const connect = async () => {
      setViewerState("connecting");
      setMessage("লাইভ DOM মিরর সংযোগ তৈরি হচ্ছে…");
      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          body: JSON.stringify({ sessionId, viewerId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.token || !data?.serverUrl) {
          throw new Error(data?.message || "লাইভ সার্ভার সেটআপ করা নেই।");
        }

        room = new Room({ adaptiveStream: false, dynacast: false });
        roomRef.current = room;
        shouldStayConnectedRef.current = true;
        room.on(RoomEvent.DataReceived, receiveData);
        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled && shouldStayConnectedRef.current) {
            setViewerState("failed");
            setMessage("লাইভ DOM সংযোগ বিচ্ছিন্ন হয়েছে। আবার অনুরোধ পাঠান।");
          }
        });
        await room.connect(String(data.serverUrl), String(data.token));
        if (cancelled) {
          await room.disconnect();
          return;
        }

        const { Replayer } = await import("@rrweb/replay");
        ReplayerConstructor = Replayer;
        if (!replayHostRef.current) throw new Error("লাইভ ভিউ কন্টেইনার প্রস্তুত নয়।");
        resetReplayer();

        let supportsGzip = false;
        try {
          if (typeof DecompressionStream !== "undefined") {
            new DecompressionStream("gzip");
            supportsGzip = true;
          }
        } catch {
          supportsGzip = false;
        }
        const control = new TextEncoder().encode(JSON.stringify({ version: 1, kind: "ready", requestId, supportsGzip }));
        await room.localParticipant.publishData(control, {
          reliable: true,
          topic: LIVE_DOM_CONTROL_TOPIC,
          destinationIdentities: [expectedUserIdentity],
        });
        setMessage("লাইভ DOM ইভেন্টের অপেক্ষায়…");
        scheduleSnapshotTimeout();
      } catch (error) {
        shouldStayConnectedRef.current = false;
        try { replayer?.destroy(); } catch { /* cleanup */ }
        if (replayerRef.current === replayer) replayerRef.current = null;
        if (room) {
          try { room.removeAllListeners(); await room.disconnect(); } catch { /* already disconnected */ }
        }
        if (roomRef.current === room) roomRef.current = null;
        if (!cancelled) {
          setViewerState("failed");
          setMessage(error instanceof Error ? error.message : "লাইভ DOM সংযোগ ব্যর্থ হয়েছে।");
        }
      }
    };

    void connect();
    statTimer = window.setInterval(() => {
      if (cancelled || !firstSnapshotSeen) return;
      const quiet = Date.now() - lastPacketAt;
      setLiveInfo(quiet < 6000 ? "লাইভ সংযুক্ত" : `সংযোগ ধীর (${Math.round(quiet / 1000)} সেকেন্ড কোনো ডেটা আসেনি)`);
      if (quiet > 12_000 && Date.now() - lastSilentAt > 30_000) { lastSilentAt = Date.now(); requestFreshSnapshot("silent"); }
    }, 1000);
    return () => {
      cancelled = true;
      if (statTimer !== null) window.clearInterval(statTimer);
      setLiveInfo("");
      shouldStayConnectedRef.current = false;
      chunks.clear();
      try { resizeObserver?.disconnect(); } catch { /* ignore */ }
      if (firstSnapshotTimer !== null) window.clearTimeout(firstSnapshotTimer);
      firstSnapshotTimer = null;
      if (room) {
        room.removeAllListeners();
        void room.disconnect();
      }
      try { replayer?.destroy(); } catch { /* already destroyed */ }
      if (replayerRef.current === replayer) replayerRef.current = null;
      if (roomRef.current === room) roomRef.current = null;
      if (replayHostRef.current) replayHostRef.current.innerHTML = "";
    };
  }, [closeRoom, requestId, sessionId, status, viewerId, selectedSession?.userId]);

  const canRequest = Boolean(selectedSession && viewerId && !["requested", "sharing"].includes(status));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-900"><Video size={17} className="text-indigo-600" /> Website live view</h3>
          <p className="mt-1 text-xs text-slate-500">ইউজারের অনুমতি নিয়ে DOM পরিবর্তন ও ইন্টারঅ্যাকশন LiveKit DataChannel দিয়ে পাঠানো হয়; ভিডিও ফ্রেম বারবার তৈরি করা হয় না।</p>
        </div>
        {selectedSession && ["requested", "sharing"].includes(status) ? (
          <button type="button" disabled={busy} onClick={() => void stopViewing()} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"><Square size={14} /> Stop viewing</button>
        ) : (
          <button type="button" disabled={!selectedSession || !canRequest || busy} onClick={() => void requestShare()} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><MonitorPlay size={15} /> {busy ? "Please wait…" : "Request live view"}</button>
        )}
      </div>
      <div className="p-4 sm:p-5">
        {!selectedSession ? (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-400">প্রথমে বাম পাশ থেকে একজন অনলাইন ইউজার নির্বাচন করুন।</div>
        ) : (
          <div className="overflow-hidden rounded-xl bg-slate-950">
            <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: viewerState === "live" ? String(replayAspectRatio) : "16 / 9", minHeight: viewerState === "live" ? 320 : undefined }}>
              <div ref={replayHostRef} className={`live-dom-replay absolute inset-0 w-full overflow-hidden ${viewerState === "live" ? "visible" : "invisible"}`} />
              <div ref={cursorRef} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 z-20 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500 opacity-0 shadow ${viewerState === "live" ? "" : "hidden"}`} style={{ transition: "transform 90ms linear" }} />
              {viewerState !== "live" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-300">
                  {busy || viewerState === "requesting" || viewerState === "connecting" ? <LoaderCircle size={28} className="animate-spin" /> : viewerState === "failed" ? <AlertCircle size={28} className="text-rose-300" /> : <MonitorPlay size={30} className="text-slate-500" />}
                  <p className="mt-3 text-sm font-semibold text-white">{viewerState === "failed" ? "Live DOM view failed" : viewerState === "connecting" && status === "sharing" ? "Connecting live DOM view" : status === "requested" ? "Waiting for user permission" : status === "sharing" ? "Waiting for live DOM snapshot" : status === "declined" ? "User declined live view" : status === "stopped" ? "Website live view stopped" : "No active live view"}</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">{message || "অনলাইন ইউজার নির্বাচন করে Request live view চাপুন। অনুমতি দিলে পেজটি লাইভ মিরর হবে।"}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="flex items-start gap-2 text-xs leading-5 text-blue-900"><ShieldCheck size={15} className="mt-0.5 shrink-0" />এটি ভিডিও/ডেস্কটপ ক্যাপচার নয়। rrweb DOM ও ইন্টারঅ্যাকশন ইভেন্ট পাঠিয়ে অ্যাডমিনের ব্রাউজারে পেজটি পুনর্গঠন করে। ফর্ম ইনপুটগুলো মাস্ক করা হয় এবং ডিফল্টভাবে রেকর্ডিং ডেটাবেসে সংরক্ষণ করা হয় না। Canvas গ্রাফিক্স, কিছু ভিডিও ও cross-origin iframe হুবহু নাও দেখা যেতে পারে। ইউজার যেকোনো সময় বন্ধ করতে পারবেন।</p>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">স্ট্যাটাস: {status} · Transport: LiveKit reliable data · Live DOM mirror · User approval required.{liveInfo ? ` · ${liveInfo}` : ""}</p>
      </div>
    </section>
  );
}
