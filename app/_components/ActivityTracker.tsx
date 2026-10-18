"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorUp, ShieldCheck, StopCircle, Video, X } from "lucide-react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/lib/presenceConstants";

type ScreenSignal =
  | { kind: "description"; value: RTCSessionDescriptionInit }
  | { kind: "candidate"; value: RTCIceCandidateInit };

type ScreenRequest = {
  adminSessionId: string;
  userId?: string;
};

const PROMPT_KEY = "sohojhub:live-screen-prompted";
const PRESENCE_SESSION_KEY = "sohojhub:presence-session-id";

function createSessionId() {
  return typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `sh-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Keeps the existing online-presence lease alive. Screen viewing is an optional,
 * explicit user-consent flow layered onto that same authenticated WebSocket. No
 * screen frames, clicks, or activity history are uploaded to a storage service.
 */
export default function ActivityTracker() {
  const [consentOpen, setConsentOpen] = useState(false);
  const [relayAvailable, setRelayAvailable] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [screenNotice, setScreenNotice] = useState("");
  const [incomingRequest, setIncomingRequest] = useState<ScreenRequest | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const queuedCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const startShareRef = useRef<((adminSessionId?: string) => Promise<void>) | null>(null);
  const stopShareRef = useRef<(() => void) | null>(null);
  const sharingRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let paused = false;
    let pageHidden = false;
    let socket: WebSocket | null = null;
    let retryTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let reconnectDelay = 1_000;
    let sessionId = createSessionId();
    let redisBroadcastAvailable = false;

    const clearTimers = () => {
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      retryTimer = null;
      heartbeatTimer = null;
    };

    const isCachedAdmin = () => {
      try {
        const raw = window.localStorage.getItem("user");
        const user = raw ? JSON.parse(raw) : null;
        return user?.role === "admin";
      } catch {
        return false;
      }
    };

    const hasPotentialUserSession = () => {
      try {
        return Boolean(window.localStorage.getItem("token"));
      } catch {
        // If storage is blocked, let the HttpOnly-cookie based ticket request decide.
        return true;
      }
    };

    const sendJson = (payload: Record<string, unknown>) => {
      const activeSocket = socketRef.current;
      if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) return false;
      try {
        activeSocket.send(JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    };

    const sendStatus = (status: "sharing" | "not-sharing" | "stopped" | "denied" | "requesting") => {
      sendJson({ type: "screen-status", status });
    };

    const sendSignal = (adminSessionId: string, signal: ScreenSignal) => {
      sendJson({ type: "screen-signal", toSessionId: adminSessionId, signal });
    };

    const closePeer = (adminSessionId: string) => {
      const peer = peersRef.current.get(adminSessionId);
      if (peer) {
        peer.onicecandidate = null;
        peer.onconnectionstatechange = null;
        try { peer.close(); } catch { /* already closed */ }
        peersRef.current.delete(adminSessionId);
      }
      queuedCandidatesRef.current.delete(adminSessionId);
    };

    const closeAllPeers = () => {
      for (const id of [...peersRef.current.keys()]) closePeer(id);
    };

    const stopSharing = (notify = true) => {
      const stream = screenStreamRef.current;
      screenStreamRef.current = null;
      sharingRef.current = false;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.onended = null;
          try { track.stop(); } catch { /* a track may already be ended */ }
        }
      }
      closeAllPeers();
      setIsSharing(false);
      setIncomingRequest(null);
      if (notify) sendStatus("stopped");
    };

    const makePeer = (adminSessionId: string) => {
      const stream = screenStreamRef.current;
      if (!stream) return null;
      closePeer(adminSessionId);
      const peer = new RTCPeerConnection({
        // STUN enables direct peer-to-peer connectivity without routing video through the app.
        // Some restrictive networks may require a TURN relay to be configured separately.
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peersRef.current.set(adminSessionId, peer);
      for (const track of stream.getTracks()) peer.addTrack(track, stream);
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(adminSessionId, { kind: "candidate", value: event.candidate.toJSON() });
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "closed") {
          if (peersRef.current.get(adminSessionId) === peer) peersRef.current.delete(adminSessionId);
        }
      };
      return peer;
    };

    const startPeerOffer = async (adminSessionId: string) => {
      const peer = makePeer(adminSessionId);
      if (!peer) {
        setIncomingRequest({ adminSessionId });
        setScreenNotice("অনুমতি দিলে ব্রাউজারের তালিকা থেকে Sohoj Hub ট্যাবটি বেছে নিন।");
        sendStatus("not-sharing");
        return;
      }
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        if (peer.localDescription) {
          sendSignal(adminSessionId, { kind: "description", value: peer.localDescription.toJSON() });
        }
      } catch {
        setScreenNotice("লাইভ সংযোগ তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        sendStatus("not-sharing");
        closePeer(adminSessionId);
      }
    };

    const handleRemoteSignal = async (adminSessionId: string, signal: ScreenSignal) => {
      let peer = peersRef.current.get(adminSessionId);
      if (!peer && screenStreamRef.current) peer = makePeer(adminSessionId) || undefined;
      if (!peer) return;

      try {
        if (signal.kind === "description") {
          await peer.setRemoteDescription(new RTCSessionDescription(signal.value));
          if (signal.value.type === "offer") {
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            if (peer.localDescription) {
              sendSignal(adminSessionId, { kind: "description", value: peer.localDescription.toJSON() });
            }
          }
          const queued = queuedCandidatesRef.current.get(adminSessionId) || [];
          queuedCandidatesRef.current.delete(adminSessionId);
          for (const candidate of queued) {
            try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale candidate */ }
          }
        } else if (peer.remoteDescription) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.value));
        } else {
          const queued = queuedCandidatesRef.current.get(adminSessionId) || [];
          queued.push(signal.value);
          queuedCandidatesRef.current.set(adminSessionId, queued);
        }
      } catch {
        setScreenNotice("লাইভ স্ক্রিন সংযোগে সমস্যা হয়েছে। আবার সংযোগ দিন।");
      }
    };

    const startScreenShare = async (adminSessionId?: string) => {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setScreenNotice("এই ব্রাউজারে স্ক্রিন শেয়ারিং সমর্থিত নয়। Chrome বা Edge-এর সাম্প্রতিক সংস্করণ ব্যবহার করুন।");
        sendStatus("denied");
        return;
      }
      if (!redisBroadcastAvailable) {
        setScreenNotice("এই মুহূর্তে লাইভ সংযোগ উপলভ্য নয়। পরে আবার চেষ্টা করুন।");
        return;
      }

      try {
        // This call is intentionally made directly from the user's button click so
        // the browser's own screen picker and permission prompt cannot be bypassed.
        const options = {
          video: true,
          audio: false,
          preferCurrentTab: true,
        } as DisplayMediaStreamOptions & { preferCurrentTab: boolean };
        const stream = await navigator.mediaDevices.getDisplayMedia(options);
        screenStreamRef.current = stream;
        sharingRef.current = true;
        setIsSharing(true);
        setConsentOpen(false);
        setIncomingRequest(null);
        setScreenNotice("");
        sendStatus("sharing");
        for (const track of stream.getVideoTracks()) {
          track.onended = () => stopSharing(true);
        }
        if (adminSessionId) await startPeerOffer(adminSessionId);
      } catch (error) {
        const err = error as DOMException;
        if (err?.name !== "NotAllowedError" && err?.name !== "AbortError") {
          setScreenNotice("স্ক্রিন শেয়ারিং চালু করা যায়নি। ব্রাউজারের অনুমতি ও সাইটের HTTPS সংযোগ পরীক্ষা করুন।");
        } else {
          setScreenNotice("আপনি স্ক্রিন শেয়ারিং অনুমতি দেননি। ওয়েবসাইট স্বাভাবিকভাবেই ব্যবহার করতে পারবেন।");
        }
        sendStatus("denied");
        setConsentOpen(false);
        setIncomingRequest(null);
      }
    };

    startShareRef.current = startScreenShare;
    stopShareRef.current = () => stopSharing(true);

    const scheduleReconnect = (delay = reconnectDelay) => {
      if (disposed || paused || pageHidden || retryTimer !== null) return;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
      reconnectDelay = Math.min(Math.max(reconnectDelay * 2, 1_000), 15_000);
    };

    const connect = async () => {
      if (disposed || paused || pageHidden || isCachedAdmin() || !hasPotentialUserSession()) return;
      clearTimers();
      sessionStorageSafeSet(PRESENCE_SESSION_KEY, sessionId);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          const token = window.localStorage.getItem("token");
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          // The HttpOnly cookie remains authoritative if localStorage is unavailable.
        }

        const ticketResponse = await fetch("/api/auth/presence/ticket", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers,
          body: JSON.stringify({ sessionId }),
        });
        const ticketData = await ticketResponse.json().catch(() => ({}));
        if (ticketData?.role === "admin") return;
        if (!ticketResponse.ok || !ticketData?.ticket || ticketData?.role !== "user") {
          scheduleReconnect(ticketResponse.status === 401 ? 15_000 : reconnectDelay);
          return;
        }

        redisBroadcastAvailable = ticketData.broadcastAvailable === true;
        setRelayAvailable(redisBroadcastAvailable);
        if (disposed || paused || pageHidden) return;
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${wsProtocol}//${window.location.host}/api/auth/presence/ws?ticket=${encodeURIComponent(ticketData.ticket)}`;
        const nextSocket = new WebSocket(url);
        socket = nextSocket;
        socketRef.current = nextSocket;

        nextSocket.addEventListener("open", () => {
          reconnectDelay = 1_000;
          if (!redisBroadcastAvailable) {
            setScreenNotice("লাইভ স্ক্রিন দেখার জন্য সার্ভারের রিয়েল-টাইম সংযোগ বর্তমানে কনফিগার করা নেই।");
          }
          const prompted = safeSessionStorageGet(PROMPT_KEY);
          if (!prompted) {
            safeSessionStorageSet(PROMPT_KEY, "1");
            setConsentOpen(true);
          }
          const ping = () => {
            if (nextSocket.readyState !== WebSocket.OPEN) return;
            try {
              const canReadStorage = typeof window.localStorage !== "undefined";
              const token = window.localStorage.getItem("token");
              if (canReadStorage && !token) {
                paused = true;
                clearTimers();
                stopSharing(true);
                nextSocket.send("leave");
                nextSocket.close(1000, "User session cleared");
                return;
              }
            } catch {
              // Keep the connection if browser storage is disabled; the cookie is authoritative.
            }
            nextSocket.send("ping");
          };
          ping();
          heartbeatTimer = window.setInterval(ping, PRESENCE_HEARTBEAT_INTERVAL_MS);
        });

        nextSocket.addEventListener("message", (event) => {
          if (typeof event.data !== "string") return;
          let message: any;
          try { message = JSON.parse(event.data); } catch { return; }
          if (message?.type === "screen-query") {
            sendStatus(screenStreamRef.current ? "sharing" : "not-sharing");
            return;
          }
          if (message?.type === "screen-request" && typeof message.adminSessionId === "string") {
            if (screenStreamRef.current) {
              void startPeerOffer(message.adminSessionId);
            } else {
              setIncomingRequest({ adminSessionId: message.adminSessionId, userId: message.userId });
              setScreenNotice("");
              sendStatus("requesting");
            }
            return;
          }
          if (message?.type === "screen-signal" && typeof message.fromSessionId === "string" && message.signal) {
            void handleRemoteSignal(message.fromSessionId, message.signal as ScreenSignal);
            return;
          }
          if (message?.type === "screen-stop" && typeof message.fromSessionId === "string") {
            closePeer(message.fromSessionId);
          }
          if (message?.type === "realtime-unavailable") {
            redisBroadcastAvailable = false;
            setRelayAvailable(false);
            setScreenNotice("লাইভ স্ক্রিন সংযোগ এই মুহূর্তে উপলভ্য নয়।");
          }
        });

        nextSocket.addEventListener("close", () => {
          if (socket === nextSocket) socket = null;
          if (socketRef.current === nextSocket) socketRef.current = null;
          clearTimers();
          if (!disposed && !paused && !pageHidden) scheduleReconnect();
        });

        nextSocket.addEventListener("error", () => {
          try { nextSocket.close(); } catch { /* onclose schedules retry */ }
        });
      } catch {
        scheduleReconnect(reconnectDelay);
      }
    };

    const stopForLogout = () => {
      paused = true;
      clearTimers();
      stopSharing(true);
      safeSessionStorageRemove(PROMPT_KEY);
      setConsentOpen(false);
      setIncomingRequest(null);
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "User logged out");
      }
      socket = null;
      socketRef.current = null;
    };

    const resumeAfterLogin = () => {
      paused = false;
      sessionId = createSessionId();
      sessionStorageSafeSet(PRESENCE_SESSION_KEY, sessionId);
      safeSessionStorageRemove(PROMPT_KEY);
      setConsentOpen(false);
      clearTimers();
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, "Session changed");
      else socket = null;
      socketRef.current = null;
      void connect();
    };

    const onPageHide = () => {
      pageHidden = true;
      clearTimers();
      stopSharing(true);
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "Page hidden or closed");
      }
      socket = null;
      socketRef.current = null;
    };

    const onPageShow = () => {
      if (!pageHidden) return;
      pageHidden = false;
      sessionId = createSessionId();
      sessionStorageSafeSet(PRESENCE_SESSION_KEY, sessionId);
      void connect();
    };

    window.addEventListener("sohojhub:presence-stop", stopForLogout);
    window.addEventListener("sohojhub:auth-changed", resumeAfterLogin);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    void connect();

    return () => {
      disposed = true;
      clearTimers();
      window.removeEventListener("sohojhub:presence-stop", stopForLogout);
      window.removeEventListener("sohojhub:auth-changed", resumeAfterLogin);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      stopSharing(true);
      if (socket && socket.readyState < WebSocket.CLOSING) {
        if (socket.readyState === WebSocket.OPEN) socket.send("leave");
        socket.close(1000, "Presence tracker disposed");
      }
      if (socketRef.current === socket) socketRef.current = null;
      startShareRef.current = null;
      stopShareRef.current = null;
    };
  }, []);

  const startClicked = () => {
    setScreenNotice("");
    void startShareRef.current?.(incomingRequest?.adminSessionId);
  };

  const declineClicked = () => {
    const activeSocket = socketRef.current;
    if (activeSocket?.readyState === WebSocket.OPEN) {
      try {
        activeSocket.send(JSON.stringify({ type: "screen-status", status: incomingRequest ? "denied" : "not-sharing" }));
      } catch { /* connection may be closing */ }
    }
    setConsentOpen(false);
    setIncomingRequest(null);
    setScreenNotice("");
  };

  return (
    <>
      {isSharing && (
        <div className="fixed right-4 top-20 z-[9998] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-emerald-200 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="min-w-0 text-slate-700">
            <span className="block font-semibold text-emerald-800">লাইভ স্ক্রিন শেয়ার চালু</span>
            <span className="block text-xs text-slate-500">অ্যাডমিন নির্বাচিত স্ক্রিনটি দেখতে পারবেন।</span>
          </span>
          <button
            type="button"
            onClick={() => stopShareRef.current?.()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <StopCircle size={15} /> বন্ধ করুন
          </button>
        </div>
      )}

      {(consentOpen || incomingRequest) && !isSharing && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sohojhub-live-share-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {incomingRequest ? <Video size={22} /> : <MonitorUp size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="sohojhub-live-share-title" className="text-lg font-bold text-slate-900">
                  {incomingRequest ? "অ্যাডমিন লাইভ স্ক্রিন দেখতে চাইছেন" : "লাইভ স্ক্রিন দেখার অনুমতি"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {incomingRequest
                    ? "স্ক্রিন শেয়ার করলে অ্যাডমিন আপনার নির্বাচিত ট্যাব বা উইন্ডো সরাসরি দেখতে পারবেন। অনুমতি দেওয়া ঐচ্ছিক।"
                    : "আপনি অনুমতি দিলে Sohoj Hub-এর অ্যাডমিন আপনার নির্বাচিত ট্যাব বা উইন্ডো লাইভ দেখতে পারবেন, যাতে কোনো কাজ বা ছবির সমস্যা হলে সহায়তা করতে পারেন।"}
                </p>
              </div>
              <button type="button" onClick={declineClicked} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="বন্ধ করুন">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
                <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                <p>
                  কোনো স্ক্রিন রেকর্ডিং বা অ্যাক্টিভিটি লগ সংরক্ষণ করা হয় না। ব্রাউজারের নিজস্ব স্ক্রিন-পিকার খুলবে; নিরাপদ থাকতে শুধু Sohoj Hub ট্যাবটি বেছে নিন। চাইলে যেকোনো সময় শেয়ার বন্ধ করতে পারবেন।
                </p>
              </div>
              {!relayAvailable && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  লাইভ সংযোগ বর্তমানে উপলভ্য নয়। সার্ভারের রিয়েল-টাইম সংযোগ সক্রিয় না থাকায় এখন স্ক্রিন শেয়ার শুরু করা যাবে না।
                </p>
              )}
              {screenNotice && <p role="status" className="text-sm text-rose-600">{screenNotice}</p>}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={declineClicked} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {incomingRequest ? "অনুমতি দেব না" : "এখন নয়"}
                </button>
                <button
                  type="button"
                  onClick={startClicked}
                  disabled={!relayAvailable}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MonitorUp size={16} /> অনুমতি দিন ও স্ক্রিন বেছে নিন
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-400">অনুমতি না দিলেও আপনি Sohoj Hub স্বাভাবিকভাবে ব্যবহার করতে পারবেন। ব্রাউজারের শেয়ারিং নির্দেশক ব্যবহার করে শেয়ার বন্ধ করাও সম্ভব।</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function safeSessionStorageGet(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}
function safeSessionStorageSet(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* storage may be disabled */ }
}
function safeSessionStorageRemove(key: string) {
  try { window.sessionStorage.removeItem(key); } catch { /* storage may be disabled */ }
}
function sessionStorageSafeSet(key: string, value: string) {
  safeSessionStorageSet(key, value);
}
