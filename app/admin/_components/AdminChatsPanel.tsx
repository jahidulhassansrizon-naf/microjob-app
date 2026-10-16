"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/clientAuth";

type ChatUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageAt?: string | null;
  lastSenderRole?: "user" | "admin" | null;
  unreadCount: number;
  hasConversation: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  senderRole: "user" | "admin";
  createdAt: string;
  readByAdmin: boolean;
  readByUser: boolean;
};

type Pagination = { page: number; limit: number; total: number; pages: number };

const EMPTY_PAGINATION: Pagination = { page: 1, limit: 25, total: 0, pages: 1 };

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]) {
  const merged = new Map<string, ChatMessage>();
  for (const message of current) merged.set(message.id, message);
  for (const message of incoming) merged.set(message.id, message);
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function formatTime(value?: string | null, withDate = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BD", {
    ...(withDate ? { day: "2-digit", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name?: string) {
  const parts = (name || "User").trim().split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (parts[0] || "U").slice(0, 2).toUpperCase();
}

export default function AdminChatsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [messageError, setMessageError] = useState("");
  const selectedUserIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);

  const loadUsers = useCallback(async (pageToLoad = 1, quiet = false) => {
    if (!quiet) setListLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageToLoad) });
      if (appliedQuery) params.set("q", appliedQuery);
      const response = await fetch(`/api/admin/chats?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not load users.");
      const rows: ChatUser[] = Array.isArray(data?.users) ? data.users : [];
      setUsers(rows);
      setPagination(data?.pagination || EMPTY_PAGINATION);
      setListError("");
      if (selectedUserIdRef.current) {
        const fresh = rows.find((user) => user.id === selectedUserIdRef.current);
        if (fresh) setSelectedUser((current) => current?.id === fresh.id ? fresh : current);
      }
    } catch (cause) {
      if (!quiet) setListError(cause instanceof Error ? cause.message : "Could not load users.");
    } finally {
      setListLoading(false);
    }
  }, [appliedQuery]);

  const loadMessages = useCallback(async (userId: string, options?: { before?: string; silent?: boolean }) => {
    if (!options?.silent && !options?.before) setMessageLoading(true);
    if (options?.before) setOlderLoading(true);
    try {
      const params = new URLSearchParams({ userId });
      if (options?.before) params.set("before", options.before);
      const response = await fetch(`/api/admin/chats?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getClientAuthHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not load this conversation.");
      if (selectedUserIdRef.current !== userId) return;
      const incoming: ChatMessage[] = Array.isArray(data?.messages) ? data.messages : [];
      if (options?.before) setMessages((current) => mergeMessages(incoming, current));
      else setMessages((current) => mergeMessages(current, incoming));
      if (!options?.silent) setHasMore(Boolean(data?.hasMore));
      if (data?.user) {
        setSelectedUser((current) => current?.id === userId ? { ...current, ...data.user, hasConversation: true } : current);
      }
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, unreadCount: 0, hasConversation: true } : user));
      setMessageError("");
      if (!options?.before) shouldScrollRef.current = true;
    } catch (cause) {
      if (!options?.silent && selectedUserIdRef.current === userId) {
        setMessageError(cause instanceof Error ? cause.message : "Could not load this conversation.");
      }
    } finally {
      if (selectedUserIdRef.current === userId) {
        setMessageLoading(false);
        setOlderLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers(pagination.page, false);
    // refreshKey is intentionally a refresh trigger from the parent toolbar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, refreshKey, pagination.page]);

  useEffect(() => {
    const interval = window.setInterval(() => void loadUsers(pagination.page, true), 7_000);
    return () => window.clearInterval(interval);
  }, [loadUsers, pagination.page]);

  useEffect(() => {
    if (!selectedUser) return;
    const userId = selectedUser.id;
    void loadMessages(userId);
    const interval = window.setInterval(() => void loadMessages(userId, { silent: true }), 4_000);
    return () => window.clearInterval(interval);
  }, [loadMessages, selectedUser?.id]);

  useEffect(() => {
    if (!selectedUser || !shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, selectedUser]);

  const selectUser = (user: ChatUser) => {
    selectedUserIdRef.current = user.id;
    setSelectedUser(user);
    setMessages([]);
    setHasMore(false);
    setDraft("");
    setMessageError("");
    shouldScrollRef.current = true;
    setMessageLoading(true);
  };

  const returnToList = () => {
    selectedUserIdRef.current = null;
    setSelectedUser(null);
    setMessages([]);
    setDraft("");
    setMessageError("");
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setAppliedQuery(query.trim());
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser || !draft.trim() || sending) return;
    const targetUser = selectedUser;
    const text = draft.trim();
    setSending(true);
    setMessageError("");
    try {
      const response = await fetch("/api/admin/chats", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ userId: targetUser.id, text }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "Could not send the message.");
      if (data?.message && selectedUserIdRef.current === targetUser.id) {
        setMessages((current) => mergeMessages(current, [data.message as ChatMessage]));
        shouldScrollRef.current = true;
      }
      setDraft("");
      setUsers((current) => current.map((user) => user.id === targetUser.id ? {
        ...user,
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
        lastSenderRole: "admin",
        hasConversation: true,
      } : user));
    } catch (cause) {
      setMessageError(cause instanceof Error ? cause.message : "Could not send the message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-190px)] min-h-[520px] max-h-[850px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><MessageCircle size={20} /></span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">User Chats</h2>
            <p className="mt-0.5 text-xs text-slate-500">Message any registered user and manage support conversations.</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadUsers(pagination.page)} disabled={listLoading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={14} className={listLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {listError && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{listError}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${selectedUser ? "hidden lg:flex" : "flex"} min-h-0 flex-col overflow-hidden border-b border-slate-100 lg:border-b-0 lg:border-r`}>
          <form onSubmit={submitSearch} className="border-b border-slate-100 p-3">
            <label className="sr-only" htmlFor="admin-chat-search">Search users</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input id="admin-chat-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find by name, email or phone" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              <button type="submit" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Search</button>
            </div>
          </form>

          <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Users</span><span>{pagination.total.toLocaleString("en-BD")}</span>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain">
            {listLoading && !users.length ? (
              <div className="space-y-4 p-4" aria-busy="true">
                {Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-3"><span className="h-10 w-10 animate-pulse rounded-full bg-slate-100" /><div className="flex-1 space-y-2"><span className="block h-3 w-2/3 animate-pulse rounded bg-slate-100" /><span className="block h-2.5 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>)}
              </div>
            ) : users.length ? users.map((user) => {
              const active = selectedUser?.id === user.id;
              return (
                <button key={user.id} type="button" onClick={() => selectUser(user)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${active ? "bg-indigo-50/80" : "hover:bg-slate-50"}`}>
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                    {user.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="h-full w-full object-cover" /> : initials(user.fullName)}
                    <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${user.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${active ? "text-indigo-800" : "text-slate-800"}`}>{user.fullName || "Unnamed user"}</span>
                      {user.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{user.unreadCount > 99 ? "99+" : user.unreadCount}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{user.lastMessage || user.email || user.phoneNumber || "Start a new conversation"}</span>
                    <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>{user.lastMessageAt ? formatTime(user.lastMessageAt, true) : user.isOnline ? "Online now" : "No messages yet"}</span>
                      {!user.hasConversation && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">New chat</span>}
                    </span>
                  </span>
                </button>
              );
            }) : (
              <div className="px-6 py-12 text-center"><UserRound className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-medium text-slate-700">No users found</p><p className="mt-1 text-xs text-slate-500">Try a different name, email or phone.</p></div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 text-xs text-slate-500">
            <span>{pagination.total ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}` : "0 users"}</span>
            <span className="flex items-center gap-1">
              <button type="button" aria-label="Previous users page" disabled={pagination.page <= 1 || listLoading} onClick={() => { const next = pagination.page - 1; setPagination((current) => ({ ...current, page: next })); }} className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={15} /></button>
              <span className="min-w-8 text-center">{pagination.page}/{pagination.pages}</span>
              <button type="button" aria-label="Next users page" disabled={pagination.page >= pagination.pages || listLoading} onClick={() => { const next = pagination.page + 1; setPagination((current) => ({ ...current, page: next })); }} className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={15} /></button>
            </span>
          </div>
        </aside>

        <div className={`${selectedUser ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col overflow-hidden`}>
          {selectedUser ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
                <button type="button" onClick={returnToList} aria-label="Back to users" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><ArrowLeft size={18} /></button>
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100">
                  {selectedUser.profileImageUrl ? <img src={selectedUser.profileImageUrl} alt="" className="h-full w-full object-cover" /> : initials(selectedUser.fullName)}
                  <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${selectedUser.isOnline ? "bg-emerald-500" : "bg-slate-300"}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-slate-900">{selectedUser.fullName}</h3>
                  <p className="truncate text-xs text-slate-500">{selectedUser.email}{selectedUser.phoneNumber ? ` · ${selectedUser.phoneNumber}` : ""}</p>
                </div>
                <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${selectedUser.isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${selectedUser.isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />{selectedUser.isOnline ? "Online" : "Offline"}</span>
              </header>

              <div className="min-h-0 flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain bg-slate-50/70 px-4 py-5 sm:px-6">
                <div className="mx-auto flex max-w-sm items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-center text-[11px] text-slate-500"><MessageCircle size={13} className="shrink-0 text-indigo-500" /> Private conversation between this user and admin</div>
                {hasMore && (
                  <div className="flex justify-center"><button type="button" disabled={olderLoading || !messages.length} onClick={() => void loadMessages(selectedUser.id, { before: messages[0]?.createdAt })} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">{olderLoading ? <LoaderCircle size={13} className="animate-spin" /> : <ChevronUp size={13} />} Load earlier messages</button></div>
                )}
                {messageLoading && !messages.length ? (
                  <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading messages…</div>
                ) : messages.length ? messages.map((message) => {
                  const mine = message.senderRole === "admin";
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[78%] ${mine ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                        {!mine && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">{selectedUser.fullName}</p>}
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                        <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}><span>{formatTime(message.createdAt, true)}</span>{mine && <span className="inline-flex items-center gap-0.5">{message.readByUser ? <CheckCheck size={12} /> : null}{message.readByUser ? "Seen" : "Sent"}</span>}</div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"><MessageCircle size={25} /></span><p className="mt-4 text-sm font-semibold text-slate-800">Start chatting with {selectedUser.fullName.split(/\s+/)[0] || "this user"}</p><p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">Send a message below. Your reply will appear in the user’s dashboard chat.</p></div>
                )}
                <div ref={bottomRef} />
              </div>

              {messageError && <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">{messageError}</p>}
              <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3 sm:p-4">
                <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder={`Message ${selectedUser.fullName.split(/\s+/)[0] || "user"}…`} aria-label="Message selected user" className="max-h-32 min-h-[44px] flex-1 resize-y bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
                  <button type="submit" disabled={!draft.trim() || sending} className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}<span className="hidden sm:inline">Send</span></button>
                </div>
                <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-400"><span>Enter to send · Shift + Enter for a new line</span><span>{draft.length}/2000</span></div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><MessageCircle size={29} /></span>
              <h3 className="mt-5 text-base font-semibold text-slate-900">Select a user to open chat</h3>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">Choose someone from the list to read their messages or start a new conversation. You can contact any registered user.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
