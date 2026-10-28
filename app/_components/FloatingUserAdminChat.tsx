"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { usePathname } from "next/navigation";
import {
  CheckCheck,
  Headphones,
  LoaderCircle,
  MessageCircle,
  Minus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";
import AdminAvatarImage from "./AdminAvatarImage";
import BrandName from "@/app/_components/BrandName";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
};

type ApiResponse = {
  success?: boolean;
  message?: string | ChatMessage;
  messages?: ChatMessage[];
  unreadCount?: number;
  hasMore?: boolean;
  user?: { role?: string };
};

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const merged = new Map<string, ChatMessage>();
  for (const message of current) merged.set(message.id, message);
  for (const message of incoming) merged.set(message.id, message);
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isRestrictedPath(pathname: string | null) {
  if (!pathname) return true;
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/login-success" ||
    pathname.startsWith("/ai-editor/mobile-upload/")
  );
}

export default function FloatingUserAdminChat() {
  const pathname = usePathname();
  const [eligible, setEligible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [chatNotice, setChatNotice] = useState("");
  const [clearingChat, setClearingChat] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [noticeText, setNoticeText] = useState("অ্যাডমিনের নতুন মেসেজ এসেছে");

  const isOpenRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const messageHistoryInitializedRef = useRef(false);
  const lastUnreadCountRef = useRef<number | null>(null);
  const lastNoticeAtRef = useRef(0);
  const notificationTimerRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const playDingRef = useRef<() => void>(() => undefined);

  isOpenRef.current = isOpen;

  const playDing = useCallback(() => {
    const context = audioContextRef.current;
    if (!soundEnabledRef.current || !context) return;
    if (context.state === "suspended") void context.resume().catch(() => undefined);

    const playTone = (frequency: number, startAt: number, duration: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.72, startAt + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.025);
    };

    const now = context.currentTime;
    try {
      playTone(784, now, 0.14);
      playTone(1046, now + 0.12, 0.2);
    } catch {
      // Sound is a convenience; never let an audio restriction affect chat delivery.
    }
  }, []);
  playDingRef.current = playDing;

  const clearNoticeTimer = useCallback(() => {
    if (notificationTimerRef.current !== null) {
      window.clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
  }, []);

  const notifyIncoming = useCallback(() => {
    if (isOpenRef.current) return;
    const now = Date.now();
    // The inline dashboard chat and the floating chat can observe the same message.
    // Keep a single sound/toast if both report it at nearly the same time.
    if (now - lastNoticeAtRef.current < 1800) return;
    lastNoticeAtRef.current = now;
    setNoticeText("অ্যাডমিনের নতুন মেসেজ এসেছে");
    setShowNotice(true);
    playDingRef.current();
    clearNoticeTimer();
    notificationTimerRef.current = window.setTimeout(() => {
      setShowNotice(false);
      notificationTimerRef.current = null;
    }, 6500);
  }, [clearNoticeTimer]);

  // The chat is available on every regular user page, but never in the admin
  // workspace, authentication screens, or token-only mobile upload screen.
  useEffect(() => {
    if (isRestrictedPath(pathname)) {
      setEligible(false);
      setIsOpen(false);
      return;
    }

    let active = true;
    void fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
      headers: getClientAuthHeaders(),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!active) return;
        setEligible(response.ok && data?.user?.role === "user");
        if (!response.ok || data?.user?.role !== "user") setIsOpen(false);
      })
      .catch(() => {
        if (active) setEligible(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  // Arm Web Audio on the user's first interaction. Browsers block unsolicited sound
  // before activation, so notification sound is safely enabled only after a gesture.
  useEffect(() => {
    if (!eligible) return;
    const armSound = () => {
      try {
        const audioWindow = window as Window & {
          webkitAudioContext?: typeof AudioContext;
        };
        const AudioContextConstructor =
          window.AudioContext || audioWindow.webkitAudioContext;
        if (!AudioContextConstructor) return;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextConstructor();
        }
        soundEnabledRef.current = true;
        if (audioContextRef.current.state === "suspended") {
          void audioContextRef.current.resume().catch(() => undefined);
        }
      } catch {
        // Unsupported audio must not disable the chat itself.
      }
    };
    window.addEventListener("pointerdown", armSound, {
      once: true,
      capture: true,
    });
    window.addEventListener("keydown", armSound, {
      once: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("pointerdown", armSound, true);
      window.removeEventListener("keydown", armSound, true);
    };
  }, [eligible]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/chat?summary=1", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      if (response.status === 401 || response.status === 403) {
        setEligible(false);
        setIsOpen(false);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as ApiResponse;
      const nextUnread = Math.max(0, Number(data?.unreadCount || 0));
      if (isOpenRef.current) {
        setUnreadCount(0);
        lastUnreadCountRef.current = 0;
        return;
      }

      const previousUnread = lastUnreadCountRef.current;
      setUnreadCount(nextUnread);
      lastUnreadCountRef.current = nextUnread;
      if (previousUnread === null) {
        if (nextUnread > 0) notifyIncoming();
      } else if (nextUnread > previousUnread) {
        notifyIncoming();
      }
    } catch {
      // A brief network failure should not hide the launcher or discard the draft.
    }
  }, [notifyIncoming]);

  const loadMessages = useCallback(
    async (options?: { before?: string; silent?: boolean }) => {
      if (!options?.silent && !options?.before) setLoading(true);
      if (options?.before) setOlderLoading(true);
      try {
        const query = options?.before
          ? `?before=${encodeURIComponent(options.before)}`
          : "";
        const response = await fetch(`/api/chat${query}`, {
          credentials: "include",
          cache: "no-store",
          headers: getClientAuthHeaders(),
        });
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        if (response.status === 401 || response.status === 403) {
          setEligible(false);
          setIsOpen(false);
          return;
        }
        if (!response.ok) {
          throw new Error(
            typeof data?.message === "string"
              ? data.message
              : "চ্যাটের মেসেজ লোড করা যায়নি।",
          );
        }

        const incoming = Array.isArray(data?.messages) ? data.messages : [];
        if (options?.before) {
          for (const item of incoming) knownMessageIdsRef.current.add(item.id);
          const merged = mergeMessages(incoming, messagesRef.current);
          messagesRef.current = merged;
          setMessages(merged);
        } else {
          const newAdminMessage = options?.silent
            ? incoming.find(
                (item) =>
                  item.senderRole === "admin" &&
                  !knownMessageIdsRef.current.has(item.id),
              )
            : undefined;

          if (newAdminMessage && messageHistoryInitializedRef.current) {
            if (isOpenRef.current) {
              playDingRef.current();
            } else {
              notifyIncoming();
            }
          }

          for (const item of incoming) knownMessageIdsRef.current.add(item.id);
          const merged = mergeMessages(messagesRef.current, incoming);
          messagesRef.current = merged;
          setMessages(merged);
          messageHistoryInitializedRef.current = true;
          if (options?.silent && newAdminMessage) {
            // New messages should be visible immediately when the panel is open.
            setError("");
          }
        }

        const nextUnread = Math.max(0, Number(data?.unreadCount || 0));
        setUnreadCount(nextUnread);
        lastUnreadCountRef.current = nextUnread;
        if (!options?.silent) {
          setHasMore(Boolean(data?.hasMore));
          setError("");
        }
      } catch (cause) {
        if (!options?.silent) {
          setError(
            cause instanceof Error
              ? cause.message
              : "চ্যাটের মেসেজ লোড করা যায়নি।",
          );
        }
      } finally {
        setLoading(false);
        setOlderLoading(false);
      }
    },
    [notifyIncoming],
  );

  // Summary polling while minimized enables unread badges and alerts. While open,
  // poll the conversation itself so replies appear without refreshing the page.
  useEffect(() => {
    if (!eligible) return;
    if (!isOpen) {
      void loadSummary();
      const summaryTimer = window.setInterval(() => void loadSummary(), 5000);
      return () => window.clearInterval(summaryTimer);
    }
    const messageTimer = window.setInterval(
      () => void loadMessages({ silent: true }),
      4000,
    );
    return () => window.clearInterval(messageTimer);
  }, [eligible, isOpen, loadMessages, loadSummary]);

  useEffect(() => {
    if (!isOpen) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!eligible) return;
    const handleSupportMessage = () => {
      if (!isOpenRef.current) notifyIncoming();
    };
    window.addEventListener(
      "sohoj-support-message",
      handleSupportMessage as EventListener,
    );
    return () =>
      window.removeEventListener(
        "sohoj-support-message",
        handleSupportMessage as EventListener,
      );
  }, [eligible, notifyIncoming]);

  useEffect(
    () => () => {
      clearNoticeTimer();
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
    },
    [clearNoticeTimer],
  );

  const openChat = () => {
    clearNoticeTimer();
    setShowNotice(false);
    setError("");
    setIsOpen(true);
    void loadMessages();
  };

  const closeChat = () => setIsOpen(false);

  const clearChatHistory = async () => {
    if (clearingChat || sending) return;
    if (!window.confirm("আপনি কি অ্যাডমিনের সঙ্গে সম্পূর্ণ চ্যাট হিস্ট্রি স্থায়ীভাবে ডিলিট করতে চান? আপনার ও অ্যাডমিনের সব মেসেজ ডাটাবেজ থেকেও মুছে যাবে। এই কাজ ফিরিয়ে নেওয়া যাবে না।")) return;

    setClearingChat(true);
    setError("");
    setChatNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !data?.success) {
        throw new Error(typeof data?.message === "string" ? data.message : "চ্যাট হিস্ট্রি ডিলিট করা যায়নি।");
      }
      messagesRef.current = [];
      knownMessageIdsRef.current.clear();
      messageHistoryInitializedRef.current = true;
      lastUnreadCountRef.current = 0;
      setMessages([]);
      setHasMore(false);
      setUnreadCount(0);
      setChatNotice("আপনার চ্যাট হিস্ট্রি ডাটাবেজ থেকে ডিলিট হয়েছে।");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "চ্যাট হিস্ট্রি ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setClearingChat(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    setChatNotice("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...getClientAuthHeaders(),
        },
        body: JSON.stringify({ text }),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (response.status === 401 || response.status === 403) {
        setEligible(false);
        setIsOpen(false);
        return;
      }
      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।",
        );
      }
      const sentMessage =
        data?.message && typeof data.message === "object"
          ? (data.message as ChatMessage)
          : null;
      if (sentMessage) {
        const merged = mergeMessages(messagesRef.current, [sentMessage]);
        messagesRef.current = merged;
        knownMessageIdsRef.current.add(sentMessage.id);
        setMessages(merged);
      }
      setDraft("");
      setUnreadCount(0);
      lastUnreadCountRef.current = 0;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "মেসেজ পাঠানো যায়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setSending(false);
    }
  };

  if (!eligible) return null;

  return (
    <>
      {showNotice && !isOpen && (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-[88px] right-4 z-[121] flex max-w-[min(340px,calc(100vw-32px))] items-center gap-3 rounded-2xl border border-rose-200 bg-white px-3.5 py-3 text-left shadow-[0_12px_36px_-10px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5"
          aria-label="অ্যাডমিনের নতুন মেসেজ দেখুন"
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <MessageCircle size={21} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">
              নতুন মেসেজ!
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {noticeText} · দেখতে ক্লিক করুন
            </span>
          </span>
          <span className="text-xs font-semibold text-rose-600">দেখুন</span>
        </button>
      )}

      {isOpen && (
        <section
          role="dialog"
          aria-label="অ্যাডমিন সাপোর্ট চ্যাট"
          aria-modal="false"
          className="fixed bottom-[88px] right-3 z-[120] flex max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_58px_-14px_rgba(15,23,42,0.48)] sm:right-5"
          style={{
            width: "min(380px, calc(100vw - 24px))",
            height: "min(560px, calc(100dvh - 112px))",
          }}
        >
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-rose-600 to-red-500 px-4 py-3.5 text-white">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/70 bg-white/15">
              <AdminAvatarImage alt="Admin profile" className="h-full w-full object-cover object-[center_24%]" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-rose-600 bg-emerald-400" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                <BrandName accentClassName="text-white" /> · Admin Support
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-rose-50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                আপনার যেকোনো প্রশ্ন লিখুন
              </span>
            </span>
            <button
              type="button"
              onClick={() => void clearChatHistory()}
              disabled={clearingChat || sending}
              aria-label="চ্যাট হিস্ট্রি ডিলিট করুন"
              title="Delete chat history"
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 text-[10px] font-semibold text-white/95 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {clearingChat ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>{clearingChat ? "মুছছে…" : "চ্যাট মুছুন"}</span>
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="চ্যাট মিনিমাইজ করুন"
              title="Minimize"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <Minus size={19} />
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="চ্যাট বন্ধ করুন"
              title="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex shrink-0 items-center gap-2 border-b border-rose-100 bg-rose-50/70 px-4 py-2 text-[11px] text-slate-600">
            <Headphones size={14} className="shrink-0 text-rose-600" />
            <span className="min-w-0 flex-1">
              অ্যাডমিনকে পাঠানো মেসেজ এখানেই দেখতে পারবেন
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount} নতুন
              </span>
            )}
          </div>

          {chatNotice && (
            <div role="status" className="shrink-0 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-medium text-emerald-800">
              {chatNotice}
            </div>
          )}
          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F8FC] px-3.5 py-4 sm:px-4"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {hasMore && messages.length > 0 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={olderLoading}
                  onClick={() =>
                    void loadMessages({ before: messages[0]?.createdAt })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {olderLoading ? (
                    <LoaderCircle size={12} className="animate-spin" />
                  ) : null}
                  আগের মেসেজ দেখুন
                </button>
              </div>
            )}

            {loading && messages.length === 0 ? (
              <div className="flex h-full min-h-[140px] items-center justify-center gap-2 text-xs text-slate-500">
                <LoaderCircle size={17} className="animate-spin text-rose-500" />
                মেসেজ লোড হচ্ছে…
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => {
                const mine = message.senderRole === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {!mine && (
                      <span className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                        <AdminAvatarImage className="h-full w-full object-cover object-[center_24%]" />
                      </span>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}
                    >
                      <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                        {message.text}
                      </p>
                      <div
                        className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}
                      >
                        <span>{timeLabel(message.createdAt)}</span>
                        {mine && (
                          <CheckCheck
                            size={12}
                            className={message.readByAdmin ? "text-sky-200" : "text-indigo-200"}
                            aria-label={message.readByAdmin ? "Seen by admin" : "Sent"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm ring-1 ring-rose-100">
                  <MessageCircle size={26} />
                </span>
                <p className="mt-4 text-sm font-bold text-slate-800">
                  কীভাবে সাহায্য করতে পারি?
                </p>
                <p className="mt-1.5 max-w-[250px] text-xs leading-relaxed text-slate-500">
                  আপনার সমস্যা বা প্রশ্ন নিচে লিখে সরাসরি অ্যাডমিনকে পাঠান।
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p
              role="alert"
              className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700"
            >
              {error}
            </p>
          )}

          <form
            onSubmit={sendMessage}
            className="shrink-0 border-t border-slate-200 bg-white p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-500/10">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={2000}
                rows={1}
                placeholder="আপনার মেসেজ লিখুন…"
                aria-label="Message to admin"
                className="max-h-24 min-h-[42px] flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="মেসেজ পাঠান"
                className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>Enter চাপলে পাঠানো হবে · Shift + Enter নতুন লাইন</span>
              <span>{draft.length}/2000</span>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? closeChat : openChat}
        aria-label={isOpen ? "চ্যাট মিনিমাইজ করুন" : "অ্যাডমিনের সাথে চ্যাট করুন"}
        aria-expanded={isOpen}
        className={`fixed bottom-4 right-4 z-[122] flex items-center gap-2.5 rounded-full px-4 py-3 text-white shadow-[0_10px_30px_-7px_rgba(190,18,60,0.65)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-8px_rgba(190,18,60,0.72)] focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 ${isOpen ? "bg-slate-800 hover:bg-slate-900" : "bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600"}`}
      >
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
          {isOpen ? <Minus size={20} /> : <MessageCircle size={21} />}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-rose-600 bg-white px-1 text-[10px] font-extrabold text-rose-600">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {!isOpen && unreadCount === 0 && (
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-rose-600 bg-emerald-300" />
          )}
        </span>
        <span className="pr-0.5 text-left">
          <span className="block text-sm font-bold leading-tight">
            {isOpen ? "চ্যাট মিনিমাইজ" : "অ্যাডমিন সাপোর্ট"}
          </span>
          {!isOpen && (
            <span className="mt-0.5 block text-[10px] leading-tight text-rose-50">
              মেসেজ করতে ক্লিক করুন
            </span>
          )}
        </span>
      </button>
    </>
  );
}
