"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CircleHelp,
  LoaderCircle,
  MonitorPlay,
  RefreshCw,
  ShieldCheck,
  StopCircle,
  UserRound,
  Video,
  Wifi,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

type LiveSession = {
  userId: string;
  sessionId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  lastHeartbeatAt?: string | null;
};

type ShareStatus = "sharing" | "not-sharing" | "stopped" | "denied" | "requesting" | "unknown";
type StatusRow = { status: ShareStatus; updatedAt: number };
type ScreenSignal =
  | { kind: "description"; value: RTCSessionDescriptionInit }
  | { kind: "candidate"; value: RTCIceCandidateInit };

function newSessionId() {
  return typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `admin-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function formatLastSeen(value?: string | null) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-BD", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date);
}

function statusText(status: ShareStatus) {
  switch (status) {
    case "sharing": return "Ready to view";
    case "requesting": return "Awaiting user permission";
    case "denied": return "Permission declined";
    case "stopped": return "Sharing stopped";
    case "not-sharing": return "Not sharing";
    default: return "Checking status…";
  }
}

function statusStyle(status: ShareStatus) {
  if (status === "sharing") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "requesting") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "denied") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AdminLivePanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [statuses, setStatuses] = useState<Record<string, StatusRow>>({});
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [socketState, setSocketState] = useState<"connecting" | "connected" | "unavailable">("connecting");
  const [viewerState, setViewerState] = useState<"idle" | "requesting" | "connecting" | "viewing" | "failed">("idle");
  const [viewerMessage, setViewerMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const adminSessionIdRef = useRef("");
  const selectedRef = useRef<LiveSession | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const sendJson = useCallback((payload: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    try { socket.send(JSON.stringify(payload)); return true; } catch { return false; }
  }, []);

  const closePeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.onconnectionstatechange = null;
      try { peerRef.current.close(); } catch { /* already closed */ }
      peerRef.current = null;
    }
    pendingCandidatesRef.current = [];
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const loadSessions = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/live", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not load current online sessions.");
      const nextSessions: LiveSession[] = Array.isArray(data?.sessions) ? data.sessions : [];
      setSessions(nextSessions);
      setError("");
      const selected = selectedRef.current;
      if (selected && !nextSessions.some((row) => row.sessionId === selected.sessionId)) {
        closePeer();
        selectedRef.current = null;
        setSelectedSessionId("");
        setViewerState("idle");
        setViewerMessage("ইউজারের সংযোগ শেষ হয়েছে।");
      }
    } catch (cause) {
      if (!quiet) setError(cause instanceof Error ? cause.message : "Could not load current online sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [closePeer]);

  const sendSignal = useCallback((target: LiveSession, signal: ScreenSignal) => {
    sendJson({
      type: "screen-signal",
      toSessionId: target.sessionId,
      targetUserId: target.userId,
      signal,
    });
  }, [sendJson]);

  const makeViewerPeer = useCallback((target: LiveSession) => {
    closePeer();
    selectedRef.current = target;
    const peer = new RTCPeerConnection({
      // Direct browser-to-browser video: media is not sent to a recording server.
      // Restrictive networks may require a TURN service in a later deployment step.
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = peer;
    peer.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0] || new MediaStream([event.track]);
        void videoRef.current.play().catch(() => undefined);
      }
      setViewerState("viewing");
      setViewerMessage("");
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) sendSignal(target, { kind: "candidate", value: event.candidate.toJSON() });
    };
    peer.onconnectionstatechange = () => {
      if (peerRef.current !== peer) return;
      if (peer.connectionState === "connected") {
        setViewerState("viewing");
        setViewerMessage("");
      } else if (peer.connectionState === "failed") {
        setViewerState("failed");
        setViewerMessage("সরাসরি সংযোগ তৈরি হয়নি। নেটওয়ার্কে TURN relay দরকার হতে পারে।");
      }
    };
    return peer;
  }, [closePeer, sendSignal]);

  const stopViewing = useCallback((tellUser = true) => {
    const target = selectedRef.current;
    if (tellUser && target) {
      sendJson({ type: "screen-stop", toSessionId: target.sessionId, targetUserId: target.userId });
    }
    closePeer();
    selectedRef.current = null;
    setSelectedSessionId("");
    setViewerState("idle");
    setViewerMessage("");
  }, [closePeer, sendJson]);

  const requestView = useCallback((target: LiveSession) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      setViewerMessage("লাইভ সংযোগ এখনো প্রস্তুত নয়। একটু পরে আবার চেষ্টা করুন।");
      return;
    }
    stopViewing(true);
    selectedRef.current = target;
    setSelectedSessionId(target.sessionId);
    setViewerState("requesting");
    setViewerMessage("ইউজারের সম্মতি ও স্ক্রিন বেছে নেওয়ার অপেক্ষায়…");
    makeViewerPeer(target);
    sendJson({ type: "screen-request", targetSessionId: target.sessionId, targetUserId: target.userId });
  }, [makeViewerPeer, sendJson, stopViewing]);

  useEffect(() => {
    void loadSessions(false);
    const interval = window.setInterval(() => void loadSessions(true), 5_000);
    return () => window.clearInterval(interval);
  }, [loadSessions, refreshKey]);

  useEffect(() => {
    let disposed = false;
    let retryTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let retryDelay = 1_000;
    const adminSessionId = newSessionId();
    adminSessionIdRef.current = adminSessionId;

    const clearTimers = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      retryTimer = null;
      heartbeatTimer = null;
    };

    const applyStatus = (message: any) => {
      if (typeof message.userSessionId !== "string" || typeof message.status !== "string") return;
      const status = (["sharing", "not-sharing", "stopped", "denied", "requesting"].includes(message.status)
        ? message.status : "unknown") as ShareStatus;
      setStatuses((current) => ({ ...current, [message.userSessionId]: { status, updatedAt: Date.now() } }));
      const selected = selectedRef.current;
      if (selected && selected.sessionId === message.userSessionId && ["stopped", "denied"].includes(status)) {
        closePeer();
        setViewerState("idle");
        setViewerMessage(status === "denied"
          ? "ইউজার স্ক্রিন শেয়ারের অনুমতি দেননি।"
          : "ইউজার স্ক্রিন শেয়ার বন্ধ করেছেন।");
      }
    };

    const handleSignal = async (message: any) => {
      const selected = selectedRef.current;
      const peer = peerRef.current;
      if (!selected || !peer || message.userId !== selected.userId || message.fromSessionId !== selected.sessionId || !message.signal) return;
      const signal = message.signal as ScreenSignal;
      try {
        if (signal.kind === "description") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.value));
          if (signal.value.type === "offer") {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            if (peer.localDescription) sendSignal(selected, { kind: "description", value: peer.localDescription.toJSON() });
          }
          const queued = pendingCandidatesRef.current;
          pendingCandidatesRef.current = [];
          for (const candidate of queued) {
            try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale ICE candidate */ }
          }
        } else if (peer.remoteDescription) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.value));
        } else {
          pendingCandidatesRef.current.push(signal.value);
        }
      } catch {
        setViewerState("failed");
        setViewerMessage("স্ক্রিন সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    };

    const connect = async () => {
      if (disposed) return;
      clearTimers();
      try {
        const sessionId = adminSessionIdRef.current || newSessionId();
        const response = await fetch("/api/auth/presence/ticket", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ticket || data?.role !== "admin") {
          setSocketState("unavailable");
          setError(data?.message || "Admin live connection could not be authorized.");
          return;
        }
        if (!data.broadcastAvailable) {
          setSocketState("unavailable");
          setError("Redis real-time messaging is not configured; live screen signaling is unavailable.");
          return;
        }
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const socket = new WebSocket(`${protocol}//${window.location.host}/api/auth/presence/ws?ticket=${encodeURIComponent(data.ticket)}`);
        socketRef.current = socket;
        socket.addEventListener("open", () => {
          if (disposed) return;
          retryDelay = 1_000;
          setSocketState("connected");
          setError("");
          socket.send(JSON.stringify({ type: "screen-query" }));
          heartbeatTimer = window.setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send("ping");
              socket.send(JSON.stringify({ type: "screen-query" }));
            }
          }, 15_000);
        });
        socket.addEventListener("message", (event) => {
          if (typeof event.data !== "string") return;
          let message: any;
          try { message = JSON.parse(event.data); } catch { return; }
          if (message.type === "ready") {
            sendJson({ type: "screen-query" });
          } else if (message.type === "screen-status") applyStatus(message);
          else if (message.type === "screen-signal") void handleSignal(message);
          else if (message.type === "realtime-unavailable") {
            setSocketState("unavailable");
            setError("Live signaling became unavailable. Check the Redis connection.");
          }
        });
        socket.addEventListener("close", () => {
          if (socketRef.current === socket) socketRef.current = null;
          clearTimers();
          if (disposed) return;
          setSocketState("connecting");
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            adminSessionIdRef.current = newSessionId();
            void connect();
          }, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 15_000);
        });
        socket.addEventListener("error", () => {
          try { socket.close(); } catch { /* close handler retries */ }
        });
      } catch {
        if (!disposed) {
          setSocketState("unavailable");
          setError("Could not connect to live signaling.");
        }
      }
    };

    void connect();
    return () => {
      disposed = true;
      clearTimers();
      const target = selectedRef.current;
      if (target && socketRef.current?.readyState === WebSocket.OPEN) {
        try { socketRef.current.send(JSON.stringify({ type: "screen-stop", toSessionId: target.sessionId, targetUserId: target.userId })); } catch { /* closing */ }
      }
      closePeer();
      selectedRef.current = null;
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) socketRef.current.close(1000, "Live panel closed");
      socketRef.current = null;
    };
    // The connection lifetime is owned by this effect. Signal callbacks use current state/refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closePeer, sendSignal]);

  const currentSelection = sessions.find((session) => session.sessionId === selectedSessionId) || null;
  const activeSharing = sessions.filter((session) => statuses[session.sessionId]?.status === "sharing").length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live screen sessions</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              অনলাইনে থাকা ইউজারের সেশন দেখুন। ভিডিও কেবল ইউজার অনুমতি দিয়ে স্ক্রিন বেছে নিলে সরাসরি দেখা যাবে; কোনো রেকর্ডিং বা অ্যাক্টিভিটি লগ এখানে সংরক্ষণ করা হয় না।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${socketState === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : socketState === "unavailable" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span className={`h-2 w-2 rounded-full ${socketState === "connected" ? "bg-emerald-500" : socketState === "unavailable" ? "bg-rose-500" : "bg-amber-500"}`} />
              {socketState === "connected" ? "Live connected" : socketState === "unavailable" ? "Live unavailable" : "Connecting"}
            </span>
            <button
              type="button"
              onClick={() => { setRefreshing(true); void loadSessions(false); sendJson({ type: "screen-query" }); }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 shrink-0" size={17} /> <span>{error}</span>
          </div>
        )}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Online browser sessions</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{sessions.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Sharing available</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{activeSharing}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Storage mode</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><ShieldCheck size={16} className="text-emerald-600" /> Live only · no recording</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h3 className="font-semibold text-slate-900">Currently online</h3>
              <p className="mt-0.5 text-xs text-slate-500">Auto-refreshes every 5 seconds</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{sessions.length}</span>
          </div>
          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading online users…</div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <UserRound className="mx-auto text-slate-300" size={30} />
              <p className="mt-3 text-sm font-semibold text-slate-700">No users online right now</p>
              <p className="mt-1 text-xs text-slate-500">Sessions will appear here when a user logs in.</p>
            </div>
          ) : (
            <div className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
              {sessions.map((session) => {
                const status = statuses[session.sessionId]?.status || "unknown";
                const selected = session.sessionId === selectedSessionId;
                return (
                  <article key={session.sessionId} className={`p-4 sm:p-5 ${selected ? "bg-indigo-50/60" : ""}`}>
                    <div className="flex items-start gap-3">
                      {session.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={session.profileImageUrl} alt="" className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{session.fullName.slice(0, 1).toUpperCase() || "U"}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{session.fullName}</div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">{session.email || session.phoneNumber || "Registered user"}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle(status)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status === "sharing" ? "bg-emerald-500" : status === "requesting" ? "bg-amber-500" : status === "denied" ? "bg-rose-500" : "bg-slate-400"}`} />
                            {statusText(status)}
                          </span>
                          <span className="text-[11px] text-slate-400">Heartbeat {formatLastSeen(session.lastHeartbeatAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {selected ? (
                        <button type="button" onClick={() => stopViewing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          <StopCircle size={14} /> Stop viewing
                        </button>
                      ) : (
                        <button type="button" onClick={() => requestView(session)} disabled={socketState !== "connected"} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <MonitorPlay size={14} /> {status === "sharing" ? "View live screen" : "Request screen access"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h3 className="font-semibold text-slate-900">Live screen viewer</h3>
              <p className="mt-0.5 text-xs text-slate-500">{currentSelection ? `${currentSelection.fullName} · ${currentSelection.email}` : "Select an online user to request a view"}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${viewerState === "viewing" ? "bg-emerald-50 text-emerald-700" : viewerState === "failed" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
              {viewerState === "viewing" ? <Wifi size={13} /> : viewerState === "requesting" || viewerState === "connecting" ? <LoaderCircle size={13} className="animate-spin" /> : <Video size={13} />}
              {viewerState === "viewing" ? "LIVE" : viewerState === "requesting" ? "Waiting" : viewerState === "connecting" ? "Connecting" : viewerState === "failed" ? "Connection failed" : "Standby"}
            </span>
          </div>
          <div className="bg-slate-950 p-2 sm:p-3">
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900">
              <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-contain ${viewerState === "viewing" ? "block" : "hidden"}`} />
              {viewerState !== "viewing" && (
                <div className="max-w-md px-6 text-center text-white">
                  {viewerState === "requesting" || viewerState === "connecting" ? <LoaderCircle className="mx-auto animate-spin text-indigo-300" size={34} /> : viewerState === "failed" ? <AlertCircle className="mx-auto text-rose-300" size={34} /> : <MonitorPlay className="mx-auto text-slate-500" size={38} />}
                  <p className="mt-4 text-sm font-semibold">{currentSelection ? (viewerState === "failed" ? "Live connection failed" : viewerState === "requesting" ? "Waiting for the user" : "Waiting for shared screen") : "No active viewer"}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{viewerMessage || (currentSelection ? "ইউজারকে অনুমতি দিতে হবে এবং ব্রাউজারের স্ক্রিন-পিকার থেকে Sohoj Hub ট্যাব বেছে নিতে হবে।" : "একজন অনলাইন ইউজারের পাশে Request screen access নির্বাচন করুন।")}</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3 text-xs leading-5 text-blue-800">
              <CircleHelp className="mt-0.5 shrink-0" size={15} />
              <p>ভিডিও সরাসরি ইউজারের ব্রাউজার থেকে এই অ্যাডমিন প্যানেলে যায়। সাইট কোনো ভিডিও রেকর্ড বা সংরক্ষণ করে না। ইউজার ব্রাউজারের শেয়ারিং নিয়ন্ত্রণ থেকে যেকোনো সময় বন্ধ করতে পারেন।</p>
            </div>
            <p className="text-[11px] leading-5 text-slate-400">কিছু নেটওয়ার্কে সরাসরি WebRTC সংযোগ ব্যর্থ হতে পারে; তখন কনফিগার করা TURN relay প্রয়োজন হতে পারে।</p>
          </div>
        </section>
      </div>
    </div>
  );
}
