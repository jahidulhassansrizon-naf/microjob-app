"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronUp, LoaderCircle, MessageCircle, Send } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

// Admin avatar displayed to every user in the support chat header.
const ADMIN_PROFILE_IMAGE_URL =
  "https://scontent.fdac165-1.fna.fbcdn.net/v/t39.30808-6/830162073_122117058801455546_9222997689185944451_n.jpg?stp=dst-jpg_tt6&cstp=mx1024x1536&ctp=s1024x1536&_nc_cat=100&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFXk2DRYIMaT2rWUpeNS_QDO3oAE2SwZaw7egATZLBlrFuLbZxjfp2t1mEf0QSZ0qIfZc4Yht_g_s0X90DPJ-dn&_nc_ohc=V0QxUoSmOM4Q7kNvwGA029p&_nc_oc=AdqWhphBEz4E5jLphb64chRZxLyo_CkZDH0zsckT72KGkGTjFiXJL1xcfNrMr3C59QM&_nc_zt=23&_nc_ht=scontent.fdac165-1.fna&_nc_gid=cABDVM2sgWBbemyNF0MWmg&_nc_ss=7b2a8&oh=00_AQM4A6_U0NCz7Lq_E5LID7UkYFkZQVW28_JlZWhqaKQ-Aw&oe=6AD7D82F";

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
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

export default function UserAdminChat() {
  // The conversation stays visible inside the dashboard banner; users do not need to
  // discover or open a separate modal before they can start typing.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/chat?summary=1", {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      if (!response.ok) return;
      const data = await response.json();
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      // The inline composer remains usable if a background summary refresh fails.
    }
  }, []);

  const loadMessages = useCallback(async (options?: { before?: string; silent?: boolean }) => {
    if (!options?.silent && !options?.before) setLoading(true);
    if (options?.before) setOlderLoading(true);
    try {
      const query = options?.before ? `?before=${encodeURIComponent(options.before)}` : "";
      const response = await fetch(`/api/chat${query}`, {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not load chat messages.");

      const incoming: ChatMessage[] = Array.isArray(data?.messages) ? data.messages : [];
      if (options?.before) {
        setMessages((current) => mergeMessages(incoming, current));
      } else {
        setMessages((current) => {
          if (options?.silent && incoming.some((message) => !current.some((item) => item.id === message.id))) {
            shouldScrollRef.current = true;
          }
          return mergeMessages(current, incoming);
        });
      }
      if (!options?.silent) setHasMore(Boolean(data?.hasMore));
      setUnreadCount(Number(data?.unreadCount || 0));
      setError("");
      if (!options?.before) shouldScrollRef.current = true;
    } catch (cause) {
      if (!options?.silent) {
        setError(cause instanceof Error ? cause.message : "Could not load chat messages.");
      }
    } finally {
      setLoading(false);
      setOlderLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
    void loadSummary();

    // Keep the inline conversation fresh so an admin reply appears without a page reload.
    const messageInterval = window.setInterval(() => void loadMessages({ silent: true }), 5_000);
    const summaryInterval = window.setInterval(() => void loadSummary(), 15_000);
    return () => {
      window.clearInterval(messageInterval);
      window.clearInterval(summaryInterval);
    };
  }, [loadMessages, loadSummary]);

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Your message could not be sent.");
      if (data?.message) {
        setMessages((current) => mergeMessages(current, [data.message as ChatMessage]));
        shouldScrollRef.current = true;
      }
      setDraft("");
      setUnreadCount(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-2.5 md:max-w-[350px] fit:max-w-[350px]">
      {/* Always-visible animated help notice: this makes the support feature obvious. */}
      <div className="flex w-full items-center gap-2 rounded-lg border border-[#F2B93B]/35 bg-[#F2B93B]/10 px-3 py-2 shadow-sm">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F2B93B] opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F2B93B]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold leading-snug text-white sm:text-xs">
            যেকোনো সমস্যায় অ্যাডমিনের সাথে কথা বলুন
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug text-[#C8D5F0]">
            Need help? Chat with our admin anytime.
          </span>
        </span>
        <MessageCircle size={16} className="shrink-0 text-[#F2B93B] animate-pulse" aria-hidden="true" />
      </div>

      {/* Inline chatbox — always open, with the message field visible immediately. */}
      <section
        aria-labelledby="user-admin-chat-title"
        className="flex h-[282px] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/25 bg-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.35)] sm:h-[294px] fit:h-[300px]"
      >
        <header className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 ring-1 ring-inset ring-indigo-100">
            <img
              src={ADMIN_PROFILE_IMAGE_URL}
              alt="Admin profile"
              className="h-full w-full object-cover object-[center_24%]"
              referrerPolicy="no-referrer"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="user-admin-chat-title" className="text-xs font-bold text-slate-900 sm:text-sm">
              অ্যাডমিন সাপোর্ট · Chat with Admin
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              আপনার মেসেজ এখানেই পাঠান
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white" aria-label={`${unreadCount} unread messages`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </header>

        <div
          ref={messagesViewportRef}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 px-3 py-2.5"
          aria-live="polite"
          aria-relevant="additions text"
        >
          {hasMore && messages.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={olderLoading}
                onClick={() => void loadMessages({ before: messages[0]?.createdAt })}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                {olderLoading ? <LoaderCircle size={11} className="animate-spin" /> : <ChevronUp size={11} />}
                আগের মেসেজ
              </button>
            </div>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex h-full min-h-[105px] items-center justify-center gap-2 text-xs text-slate-500">
              <LoaderCircle size={15} className="animate-spin" /> Chat লোড হচ্ছে…
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const mine = message.senderRole === "user";
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-xl px-2.5 py-1.5 shadow-sm ${mine ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"}`}>
                    <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed sm:text-xs">{message.text}</p>
                    <div className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>
                      <span>{timeLabel(message.createdAt)}</span>
                      {mine && <span>{message.readByAdmin ? "✓✓ Seen" : "✓ Sent"}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full min-h-[105px] flex-col items-center justify-center px-2 text-center">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <MessageCircle size={17} />
              </span>
              <p className="mt-2 text-[11px] font-semibold text-slate-800 sm:text-xs">কীভাবে সাহায্য করতে পারি?</p>
              <p className="mt-1 max-w-[250px] text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
                আপনার সমস্যা বা প্রশ্ন নিচে লিখে সরাসরি অ্যাডমিনকে পাঠান।
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p role="alert" className="shrink-0 border-t border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={sendMessage} className="shrink-0 border-t border-slate-200 bg-white p-2">
          <div className="flex items-end gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/10">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              rows={1}
              placeholder="এখানে মেসেজ লিখুন…"
              aria-label="Message to admin"
              className="max-h-16 min-h-[34px] flex-1 resize-y bg-transparent px-1.5 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400"
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
              aria-label="Send message"
              className="flex h-8 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between px-1 text-[9px] text-slate-400">
            <span>Enter চাপলে মেসেজ যাবে</span>
            <span>{draft.length}/2000</span>
          </div>
        </form>
      </section>
    </div>
  );
}
