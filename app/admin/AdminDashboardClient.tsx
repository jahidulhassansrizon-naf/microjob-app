"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Ban,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Clock3,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Settings2,
  Trash2,
  Unlock,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { getClientAuthHeaders, logoutClientSession } from "@/lib/clientAuth";
import AdminChatsPanel from "./_components/AdminChatsPanel";
import AdminLivePanel from "./_components/AdminLivePanel";
import SiteSettingsPanel from "./_components/SiteSettingsPanel";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";

type TabKey = "overview" | "users" | "subscriptions" | "chats" | "live" | "settings";
// useLayoutEffect in the browser (before paint), useEffect on the server (no SSR warning).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
type AdminProfile = {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isRootAdmin?: boolean;
};
type UserRow = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "admin" | "user";
  isPrimaryAdmin?: boolean;
  isBanned?: boolean;
  bannedAt?: string | null;
  bannedBy?: string;
  banReason?: string;
  createdAt?: string | null;
  lastLoginAt?: string | null;
  lastSeenAt?: string | null;
  loginCount: number;
  isOnline: boolean;
  manualAccess?: {
    enabled: boolean;
    isActive: boolean;
    expiresAt?: string | null;
    grantedAt?: string | null;
    grantedBy?: string;
  };
  subscription: null | {
    planName: string;
    amount: number;
    expiresAt?: string | null;
  };
};
function subscriptionDurationLabel(planId: string, months: number) {
  if (planId === "1-year" || months === 12) return "1 year";
  if (planId === "6-month" || months === 6) return "6 months";
  if (planId === "1-month" || months === 1) return "1 month";
  if (months > 0) return `${months} months`;
  return "Duration unavailable";
}

type SubscriptionRow = {
  id: string;
  planId: string;
  planName: string;
  months: number;
  amount: number;
  invoiceId: string;
  transactionId: string;
  paymentMethod: string;
  senderNumber?: string;
  reviewStatus?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string;
  reviewNote?: string;
  paymentStatus: string;
  accessStatus: string;
  startedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  user: null | {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  };
};
type Overview = {
  stats: {
    totalUsers: number;
    activeNow: number;
    loginsToday: number;
    activeSubscribers: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    pendingPayments: number;
    totalRevenue: number;
  };
  weeklyRegistrations: { date: string; label: string; count: number }[];
  recentUsers: UserRow[];
  recentLogins: UserRow[];
  recentSubscriptions: SubscriptionRow[];
  generatedAt?: string;
};

type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};
type Tone = "green" | "amber" | "red" | "indigo" | "slate";

function formatDate(value?: string | Date | null, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function money(value?: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function initials(name?: string) {
  const words = (name || "User").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return (words[0] || "U").slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

const CARD =
  "rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
const FOCUS =
  "cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40";
const INPUT = `h-10 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10`;
const TH = "px-5 py-3 text-xs font-medium text-slate-500";

const PILL: Record<Tone, { box: string; dot: string }> = {
  green: {
    box: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    dot: "bg-emerald-500",
  },
  amber: {
    box: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  red: { box: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  indigo: {
    box: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
    dot: "bg-indigo-500",
  },
  slate: {
    box: "bg-slate-100 text-slate-600 ring-slate-500/15",
    dot: "bg-slate-400",
  },
};

function StatusPill({ label, tone = "slate" }: { label: string; tone?: Tone }) {
  const t = PILL[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${t.box}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

function PanelHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Avatar({ name, size = "md" }: { name?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-50 font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-100 ${size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs"}`}
    >
      {initials(name)}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Users;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

function LoadingRows() {
  return (
    <div
      className="divide-y divide-slate-100"
      aria-busy="true"
      aria-label="Loading"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <span className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-slate-100/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pager({
  p,
  loading,
  onGo,
}: {
  p: ApiPagination;
  loading: boolean;
  onGo: (page: number) => void;
}) {
  const from = p.total ? (p.page - 1) * p.limit + 1 : 0;
  const to = Math.min(p.page * p.limit, p.total);
  const btn = `flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 ${FOCUS}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 text-sm text-slate-500">
      <span>
        Showing{" "}
        <span className="font-medium text-slate-700">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700">
          {p.total.toLocaleString("en-BD")}
        </span>
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={p.page <= 1 || loading}
          onClick={() => onGo(p.page - 1)}
          className={btn}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[56px] text-center text-sm font-medium text-slate-700">
          {p.page} / {p.pages}
        </span>
        <button
          disabled={p.page >= p.pages || loading}
          onClick={() => onGo(p.page + 1)}
          className={btn}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function subscriptionTones(item: SubscriptionRow) {
  const active =
    item.paymentStatus === "COMPLETED" &&
    item.accessStatus === "ACTIVE" &&
    Boolean(item.expiresAt && new Date(item.expiresAt).getTime() > Date.now());
  const paymentTone: Tone =
    item.paymentStatus === "COMPLETED"
      ? "green"
      : item.paymentStatus === "PENDING"
        ? "amber"
        : "red";
  const accessTone: Tone = active
    ? "green"
    : item.accessStatus === "PENDING"
      ? "amber"
      : item.accessStatus === "CANCELLED"
        ? "red"
        : "slate";
  return { active, paymentTone, accessTone };
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const { settings: siteSettings } = useSiteSettings();
  const [tab, setTab] = useState<TabKey>("overview");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  // app/admin/page.tsx has ALREADY verified the admin token on the server before this component is
  // rendered (it redirects otherwise), so the dashboard is rendered immediately. The old
  // "Verifying administrator access..." card sat on a flat grey screen behind the "Login Successful"
  // popup until /api/auth/me answered. The /api/auth/me check below still runs in the background
  // and redirects away if the session turns out to be invalid.
  const [authorized, setAuthorized] = useState(true);
  const [booting, setBooting] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hoverBar, setHoverBar] = useState<number | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [liveRefreshKey, setLiveRefreshKey] = useState(0);

  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("all");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersNotice, setUsersNotice] = useState("");
  const [accessModalUser, setAccessModalUser] = useState<UserRow | null>(null);
  const [accessDurationMonths, setAccessDurationMonths] = useState("6");
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [userActionBusy, setUserActionBusy] = useState(false);
  const [userActionError, setUserActionError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [temporaryPasswordCopied, setTemporaryPasswordCopied] = useState(false);
  const [confirmingUserDelete, setConfirmingUserDelete] = useState(false);
  const [deleteUserConfirmationText, setDeleteUserConfirmationText] = useState("");
  const [deleteUserError, setDeleteUserError] = useState("");
  const [userDeleting, setUserDeleting] = useState(false);
  const [userPagination, setUserPagination] = useState<ApiPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [appliedSubscriptionSearch, setAppliedSubscriptionSearch] =
    useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("all");
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [reviewActionError, setReviewActionError] = useState("");
  const [reviewingSubscriptionId, setReviewingSubscriptionId] = useState("");
  const [subscriptionActionBusyId, setSubscriptionActionBusyId] = useState("");
  const [subscriptionDeleteBusyId, setSubscriptionDeleteBusyId] = useState("");
  const [subscriptionPagination, setSubscriptionPagination] =
    useState<ApiPagination>({ page: 1, limit: 20, total: 0, pages: 1 });

  const authHeaders = useCallback(() => getClientAuthHeaders(), []);

  useEffect(() => {
    if (!authorized) return;
    let active = true;
    const refreshUnreadCount = async () => {
      try {
        const response = await fetch("/api/admin/chats?summary=1", {
          credentials: "include",
          cache: "no-store",
          headers: authHeaders(),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setChatUnreadCount(Number(data?.unreadTotal || 0));
      } catch {
        // A missed badge refresh must not disrupt the admin dashboard.
      }
    };
    void refreshUnreadCount();
    const interval = window.setInterval(() => void refreshUnreadCount(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authorized, authHeaders]);

  const loadOverview = useCallback(
    async (quiet = false) => {
      if (!quiet) setOverviewLoading(true);
      try {
        const response = await fetch("/api/admin/overview", {
          credentials: "include",
          cache: "no-store",
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "Could not load dashboard data.");
        }
        setOverview(data as Overview);
        setGlobalError("");
      } catch (error) {
        setGlobalError(
          error instanceof Error
            ? error.message
            : "Could not load dashboard data.",
        );
      } finally {
        if (!quiet) setOverviewLoading(false);
      }
    },
    [authHeaders],
  );

  const loadUsers = useCallback(
    async (
      page = 1,
      search = appliedUserSearch,
      status = userStatus,
      quiet = false,
    ) => {
      if (!quiet) setUsersLoading(true);
      setUsersError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          status,
        });
        if (search.trim()) params.set("q", search.trim());
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data?.message || "Could not load users.");
        setUsers(data.users || []);
        setUserPagination(
          data.pagination || { page, limit: 20, total: 0, pages: 1 },
        );
      } catch (error) {
        setUsersError(
          error instanceof Error ? error.message : "Could not load users.",
        );
      } finally {
        if (!quiet) setUsersLoading(false);
      }
    },
    [authHeaders, appliedUserSearch, userStatus],
  );

  const updateManualAccess = async (action: "grant" | "revoke") => {
    if (!accessModalUser || accessSaving) return;

    setAccessSaving(true);
    setAccessError("");
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(accessModalUser.id)}/manual-access`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "grant"
              ? { action, months: Number(accessDurationMonths) }
              : { action },
          ),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Could not update manual access.");
      }

      setUsersNotice(data.message || "Manual access updated.");
      setAccessModalUser(null);
      await loadUsers(userPagination.page);
    } catch (error) {
      setAccessError(
        error instanceof Error
          ? error.message
          : "Could not update manual access.",
      );
    } finally {
      setAccessSaving(false);
    }
  };

  const performUserAction = async (
    action: "ban" | "unban" | "grant-admin" | "remove-admin" | "reset-password",
  ) => {
    const target = accessModalUser;
    if (!target || userActionBusy) return;

    const prompts: Record<typeof action, string> = {
      ban: `Disable all tool access for ${target.fullName || target.email}? They will still be able to log in and browse the website.`,
      unban: `Restore tool access for ${target.fullName || target.email}?`,
      "grant-admin": `Grant full administrator access to ${target.fullName || target.email}? This allows access to the admin workspace.`,
      "remove-admin": `Remove administrator privileges from ${target.fullName || target.email}?`,
      "reset-password": `Reset the password for ${target.fullName || target.email}? Existing signed-in sessions will be invalidated.`,
    };
    if (!window.confirm(prompts[action])) return;

    setUserActionBusy(true);
    setUserActionError("");
    setTemporaryPassword("");
    setTemporaryPasswordCopied(false);
    setAccessError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Could not update this account.");
      }

      if (typeof data.temporaryPassword === "string") {
        setTemporaryPassword(data.temporaryPassword);
      }
      if (action === "ban" || action === "unban" || action === "grant-admin" || action === "remove-admin") {
        setAccessModalUser((current) => current && current.id === target.id
          ? {
              ...current,
              isBanned: Boolean(data.isBanned),
              role: data.role === "admin" ? "admin" : data.role === "user" ? "user" : current.role,
            }
          : current);
      }
      setUsersNotice(data.message || "Account updated successfully.");
      await Promise.all([loadUsers(userPagination.page), loadOverview(true)]);
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Could not update this account.");
    } finally {
      setUserActionBusy(false);
    }
  };

  const deleteUserAccount = async () => {
    const target = accessModalUser;
    if (!target || userDeleting) return;
    if (deleteUserConfirmationText !== "DELETE") {
      setDeleteUserError('Type DELETE exactly to confirm permanent account deletion.');
      return;
    }

    setUserDeleting(true);
    setDeleteUserError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Could not permanently delete this account.");
      }

      setAccessModalUser(null);
      setConfirmingUserDelete(false);
      setDeleteUserConfirmationText("");
      setUsersNotice(data.message || "The user account and associated database records were permanently deleted.");
      const nextPage = Math.min(userPagination.page, Math.max(1, Math.ceil((userPagination.total - 1) / 20)));
      await Promise.all([loadUsers(nextPage), loadOverview(true)]);
    } catch (error) {
      setDeleteUserError(error instanceof Error ? error.message : "Could not permanently delete this account.");
    } finally {
      setUserDeleting(false);
    }
  };

  const loadSubscriptions = useCallback(
    async (
      page = 1,
      search = appliedSubscriptionSearch,
      status = subscriptionStatus,
    ) => {
      setSubscriptionsLoading(true);
      setSubscriptionsError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          status,
        });
        if (search.trim()) params.set("q", search.trim());
        const response = await fetch(
          `/api/admin/subscriptions?${params.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
            headers: authHeaders(),
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(data?.message || "Could not load subscriptions.");
        setSubscriptions(data.subscriptions || []);
        setSubscriptionPagination(
          data.pagination || { page, limit: 20, total: 0, pages: 1 },
        );
      } catch (error) {
        setSubscriptionsError(
          error instanceof Error
            ? error.message
            : "Could not load subscriptions.",
        );
      } finally {
        setSubscriptionsLoading(false);
      }
    },
    [authHeaders, appliedSubscriptionSearch, subscriptionStatus],
  );

  const reviewSubscription = useCallback(
    async (item: SubscriptionRow, action: "approve" | "reject") => {
      if (reviewingSubscriptionId || subscriptionActionBusyId || subscriptionDeleteBusyId) return;
      let note = "";
      if (action === "approve") {
        if (!window.confirm(`Approve payment ${item.transactionId || item.id} for ${item.user?.fullName || "this user"}?`)) return;
      } else {
        const entered = window.prompt("Optional reason for rejecting this payment:", "");
        if (entered === null) return;
        note = entered.trim().slice(0, 500);
      }

      setReviewingSubscriptionId(item.id);
      setReviewActionError("");
      try {
        const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(item.id)}/review`, {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ action, note }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || `Could not ${action} this payment.`);
        }
        await loadSubscriptions(subscriptionPagination.page);
      } catch (error) {
        setReviewActionError(error instanceof Error ? error.message : `Could not ${action} this payment.`);
      } finally {
        setReviewingSubscriptionId("");
      }
    },
    [authHeaders, loadSubscriptions, reviewingSubscriptionId, subscriptionActionBusyId, subscriptionDeleteBusyId, subscriptionPagination.page],
  );

  const deactivateSubscription = useCallback(async (item: SubscriptionRow) => {
    if (!subscriptionTones(item).active || reviewingSubscriptionId || subscriptionActionBusyId || subscriptionDeleteBusyId) return;
    const name = item.user?.fullName || "this user";
    if (!window.confirm(`Deactivate paid access for ${name} on this ${item.planName || item.planId} subscription? The payment record will be preserved.`)) return;

    setSubscriptionActionBusyId(item.id);
    setReviewActionError("");
    try {
      const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(item.id)}/access`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || "Could not deactivate this subscription.");
      await Promise.all([
        loadSubscriptions(subscriptionPagination.page),
        loadOverview(true),
        loadUsers(userPagination.page),
      ]);
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "Could not deactivate this subscription.");
    } finally {
      setSubscriptionActionBusyId("");
    }
  }, [authHeaders, loadOverview, loadSubscriptions, loadUsers, reviewingSubscriptionId, subscriptionActionBusyId, subscriptionDeleteBusyId, subscriptionPagination.page, userPagination.page]);

  const deleteSubscriptionRecord = useCallback(async (item: SubscriptionRow) => {
    if (subscriptionDeleteBusyId || subscriptionActionBusyId || reviewingSubscriptionId) return;
    const name = item.user?.fullName || "this user";
    const active = subscriptionTones(item).active;
    const consequence = active
      ? " This may remove paid access if this is the user's only active subscription."
      : "";
    if (!window.confirm(`Permanently delete the ${item.paymentStatus.toLowerCase()} subscription/payment record for ${name}? This cannot be undone and removes the record from the database.${consequence}`)) return;

    setSubscriptionDeleteBusyId(item.id);
    setReviewActionError("");
    try {
      const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.message || "Could not delete this subscription record.");

      const nextPage = subscriptions.length === 1 && subscriptionPagination.page > 1
        ? subscriptionPagination.page - 1
        : subscriptionPagination.page;
      await Promise.all([
        loadSubscriptions(nextPage),
        loadOverview(true),
        loadUsers(userPagination.page),
      ]);
    } catch (error) {
      setReviewActionError(error instanceof Error ? error.message : "Could not delete this subscription record.");
    } finally {
      setSubscriptionDeleteBusyId("");
    }
  }, [authHeaders, loadOverview, loadSubscriptions, loadUsers, reviewingSubscriptionId, subscriptionActionBusyId, subscriptionDeleteBusyId, subscriptionPagination.page, subscriptions.length, userPagination.page]);

  const subscriptionReviewActions = (item: SubscriptionRow) => {
    const canReview = item.paymentStatus === "PENDING" && Boolean(item.transactionId);
    const active = subscriptionTones(item).active;
    const reviewBusy = reviewingSubscriptionId === item.id;
    const deactivateBusy = subscriptionActionBusyId === item.id;
    const deleteBusy = subscriptionDeleteBusyId === item.id;
    const busy = Boolean(reviewingSubscriptionId) || Boolean(subscriptionActionBusyId) || Boolean(subscriptionDeleteBusyId);
    return (
      <div className="flex min-w-[136px] flex-col items-start gap-1.5">
        {canReview && (
          <>
            <button type="button" disabled={busy} onClick={() => void reviewSubscription(item, "approve")}
              className="inline-flex max-w-full items-center justify-center rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              {reviewBusy ? "Please wait…" : "Approve"}
            </button>
            <button type="button" disabled={busy} onClick={() => void reviewSubscription(item, "reject")}
              className="inline-flex max-w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
              Reject
            </button>
          </>
        )}
        {active && (
          <button type="button" disabled={busy} onClick={() => void deactivateSubscription(item)}
            className="inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50">
            <Trash2 size={13} /> {deactivateBusy ? "Deactivating…" : "Deactivate access"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => void deleteSubscriptionRecord(item)}
          title="Permanently delete this subscription record"
          className="inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
          <Trash2 size={13} /> {deleteBusy ? "Deleting…" : "Delete record"}
        </button>
      </div>
    );
  };

  // Fill the header (email / name) from the cached account before the first paint.
  useIsoLayoutEffect(() => {
    try {
      const raw = window.localStorage.getItem("user");
      const cached = raw ? (JSON.parse(raw) as AdminProfile) : null;
      if (cached && cached.role === "admin") {
        setAdmin((current) => current ?? cached);
      }
    } catch {
      // cached profile is optional
    }
  }, []);

  useEffect(() => {
    let active = true;
    const verifyAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || !data?.user) {
          router.replace("/login?redirect=%2Fadmin");
          return;
        }
        if (data.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setAdmin(data.user);
        setAuthorized(true);
      } catch {
        if (active) router.replace("/login?redirect=%2Fadmin");
      } finally {
        if (active) setBooting(false);
      }
    };
    void verifyAdmin();
    return () => {
      active = false;
    };
  }, [authHeaders, router]);

  useEffect(() => {
    if (!authorized) return;
    void loadOverview();
    const interval = window.setInterval(() => {
      void loadOverview(true);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [authorized, loadOverview]);

  useEffect(() => {
    if (authorized && tab === "users") void loadUsers(1);
  }, [authorized, tab, appliedUserSearch, userStatus, loadUsers]);

  useEffect(() => {
    if (authorized && tab === "subscriptions") void loadSubscriptions(1);
  }, [
    authorized,
    tab,
    appliedSubscriptionSearch,
    subscriptionStatus,
    loadSubscriptions,
  ]);

  // Portable polling replaces provider-specific WebSocket/Redis fan-out. The same
  // authenticated API works in local Next.js, Vercel, and ordinary Node hosting.
  // Refresh the overview from the current database-backed presence snapshot.
  // Expired heartbeats disappear after the short lease window.
  useEffect(() => {
    if (!authorized) return;
    const interval = window.setInterval(() => {
      void loadOverview(true);
      if (tab === "users") {
        void loadUsers(userPagination.page, appliedUserSearch, userStatus, true);
      }
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [
    appliedUserSearch,
    authorized,
    loadOverview,
    loadUsers,
    tab,
    userPagination.page,
    userStatus,
  ]);

  const displayName = admin?.fullName?.trim() || "Administrator";
  const activeCount = overview?.stats.activeNow || 0;
  const navItems = useMemo(
    () => [
      { key: "overview" as const, label: "Overview", icon: LayoutDashboard, badgeCount: 0 },
      { key: "users" as const, label: "Users", icon: Users, badgeCount: 0 },
      {
        key: "subscriptions" as const,
        label: "Subscriptions",
        icon: CreditCard,
        badgeCount: 0,
      },
      {
        key: "chats" as const,
        label: "User Chats",
        icon: MessageCircle,
        badgeCount: chatUnreadCount,
      },
      {
        key: "live" as const,
        label: "Live",
        icon: Activity,
        badgeCount: 0,
      },
      {
        key: "settings" as const,
        label: "Site Settings",
        icon: Settings2,
        badgeCount: 0,
      },
    ],
    [chatUnreadCount],
  );
  const pageTitle =
    tab === "overview"
      ? "Platform overview"
      : tab === "users"
        ? "User management"
        : tab === "subscriptions"
          ? "Subscription management"
          : tab === "chats"
            ? "User chats"
            : tab === "live"
              ? "Live user activity"
              : "Website settings";

  const selectTab = (next: TabKey) => {
    setTab(next);
    setMobileNavOpen(false);
  };

  const refreshCurrent = async () => {
    setRefreshing(true);
    if (tab === "users") await loadUsers(userPagination.page);
    else if (tab === "subscriptions")
      await loadSubscriptions(subscriptionPagination.page);
    else if (tab === "chats") setChatRefreshKey((current) => current + 1);
    else if (tab === "live") setLiveRefreshKey((current) => current + 1);
    else if (tab === "settings") router.refresh();
    else await loadOverview();
    setRefreshing(false);
  };

  const logOut = async () => {
    await logoutClientSession();
    router.replace("/login");
  };

  if (booting || !authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className={`${CARD} flex items-center gap-3 px-5 py-4`}>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-sm font-medium text-slate-600">
            Verifying administrator access…
          </span>
        </div>
      </main>
    );
  }

  const stats = overview?.stats;
  const num = (v?: number) =>
    overviewLoading ? "—" : (v || 0).toLocaleString("en-BD");

  const StatCard = ({
    title,
    value,
    detail,
    icon: Icon,
    tint,
  }: {
    title: string;
    value: string;
    detail?: string;
    icon: typeof Users;
    tint: string;
  }) => (
    <article className={`${CARD} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {detail && <p className="mt-2.5 text-xs text-slate-500">{detail}</p>}
    </article>
  );

  const userRows = (rows: UserRow[]) => (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70">
              <th className={TH}>User</th>
              <th className={TH}>Contact</th>
              <th className={TH}>Status</th>
              <th className={TH}>Subscription</th>
              <th className={TH}>Last login</th>
              {tab === "users" && <th className={TH}>Access control</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.fullName} />
                    <div className="min-w-0">
                      <div className="max-w-[200px] truncate text-sm font-medium text-slate-900">
                        {user.fullName || "Unnamed user"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {user.role === "admin" ? "Administrator" : "User"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="max-w-[240px] truncate text-sm text-slate-700">
                    {user.email || "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                    {user.phoneNumber || "No phone"}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-col items-start gap-1.5">
                    {user.isBanned && <StatusPill label="Tools blocked" tone="red" />}
                    {user.isOnline ? (
                      <StatusPill label="Online now" tone="green" />
                    ) : (
                      <StatusPill label="Offline" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="space-y-2">
                    {user.subscription ? (
                      <div>
                        <StatusPill label="Paid plan active" tone="indigo" />
                        <p className="mt-1 text-xs text-slate-500">
                          {user.subscription.planName}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        {user.manualAccess?.isActive ? "No paid plan" : "No active plan"}
                      </span>
                    )}
                    {user.manualAccess?.isActive && (
                      <div>
                        <StatusPill label="Admin access active" tone="green" />
                        <p className="mt-1 text-xs text-slate-500">
                          Until {formatDate(user.manualAccess.expiresAt)}
                        </p>
                      </div>
                    )}
                    {user.manualAccess?.enabled && !user.manualAccess.isActive && (
                      <StatusPill label="Manual access expired" tone="amber" />
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-sm text-slate-700">
                    {formatDate(user.lastLoginAt, true)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {user.loginCount}{" "}
                    {user.loginCount === 1 ? "login" : "logins"}
                  </div>
                </td>
                {tab === "users" && (
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAccessModalUser(user);
                        setAccessDurationMonths("6");
                        setAccessError("");
                        setUsersNotice("");
                        setUserActionError("");
                        setTemporaryPassword("");
                        setTemporaryPasswordCopied(false);
                        setConfirmingUserDelete(false);
                        setDeleteUserConfirmationText("");
                        setDeleteUserError("");
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                    >
                      Manage access
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
        {rows.map((user) => (
          <li key={user.id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {user.fullName || "Unnamed user"}
                  </span>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {user.isBanned && <StatusPill label="Tools blocked" tone="red" />}
                    {user.isOnline ? (
                      <StatusPill label="Online" tone="green" />
                    ) : (
                      <StatusPill label="Offline" />
                    )}
                  </div>
                </div>
                <div className="mt-1 truncate text-sm text-slate-600">
                  {user.email || "—"}
                </div>
                <div className="text-xs text-slate-500 tabular-nums">
                  {user.phoneNumber || "No phone"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>
                    {user.subscription
                      ? `Plan: ${user.subscription.planName}`
                      : "No active plan"}
                  </span>
                  <span>Last login {formatDate(user.lastLoginAt, true)}</span>
                </div>
                {user.manualAccess?.isActive && (
                  <div className="mt-2">
                    <StatusPill label="Admin access active" tone="green" />
                    <p className="mt-1 text-xs text-slate-500">
                      Until {formatDate(user.manualAccess.expiresAt)}
                    </p>
                  </div>
                )}
                {tab === "users" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccessModalUser(user);
                      setAccessDurationMonths("6");
                      setAccessError("");
                      setUsersNotice("");
                      setUserActionError("");
                      setTemporaryPassword("");
                      setTemporaryPasswordCopied(false);
                      setConfirmingUserDelete(false);
                      setDeleteUserConfirmationText("");
                      setDeleteUserError("");
                    }}
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                  >
                    Manage access
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  const subscriptionRows = (rows: SubscriptionRow[]) => (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70">
              <th className={TH}>Customer</th>
              <th className={TH}>Plan</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={TH}>Payment</th>
              <th className={TH}>Access</th>
              <th className={TH}>Expires</th>
              <th className={`${TH} min-w-[150px]`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => {
              const { active, paymentTone, accessTone } =
                subscriptionTones(item);
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/70"
                >
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-slate-900">
                      {item.user?.fullName || "Unknown user"}
                    </div>
                    <div className="mt-0.5 max-w-[220px] truncate text-xs text-slate-500">
                      {item.user?.email || "Account unavailable"}
                    </div>
                    {item.user?.phoneNumber && (
                      <div className="text-xs text-slate-500 tabular-nums">
                        {item.user.phoneNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-slate-800">
                      {item.planName || item.planId}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {subscriptionDurationLabel(item.planId, item.months)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="text-sm font-semibold text-slate-900 tabular-nums">
                      {money(item.amount)}
                    </div>
                    <div className="ml-auto mt-0.5 max-w-[140px] truncate text-xs text-slate-500">
                      {item.invoiceId || item.transactionId || "No invoice"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill
                      label={item.paymentStatus || "Unknown"}
                      tone={paymentTone}
                    />
                    {item.paymentMethod && <div className="mt-1 text-xs font-semibold text-slate-700">{item.paymentMethod}</div>}
                    {item.transactionId && <div className="mt-1 max-w-[190px] break-all text-xs text-slate-500">TrxID: {item.transactionId}</div>}
                    {item.senderNumber && <div className="mt-1 text-xs text-slate-500">From: {item.senderNumber}</div>}
                    {item.reviewNote && <div className="mt-1 max-w-[200px] text-xs text-rose-700">Note: {item.reviewNote}</div>}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill
                      label={active ? "Active" : item.accessStatus || "Unknown"}
                      tone={accessTone}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm text-slate-700">
                      {formatDate(item.expiresAt)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Started {formatDate(item.startedAt)}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">{subscriptionReviewActions(item)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
        {rows.map((item) => {
          const { active, paymentTone, accessTone } = subscriptionTones(item);
          return (
            <li key={item.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {item.user?.fullName || "Unknown user"}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {item.user?.email || "Account unavailable"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900 tabular-nums">
                    {money(item.amount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.planName || item.planId} · {subscriptionDurationLabel(item.planId, item.months)}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill
                  label={item.paymentStatus || "Unknown"}
                  tone={paymentTone}
                />
                <StatusPill
                  label={active ? "Active" : item.accessStatus || "Unknown"}
                  tone={accessTone}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Expires {formatDate(item.expiresAt)} · Started{" "}
                {formatDate(item.startedAt)}
              </div>
              {(item.paymentMethod || item.transactionId || item.senderNumber) && (
                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {item.paymentMethod && <div>Method: <strong>{item.paymentMethod}</strong></div>}
                  {item.transactionId && <div className="mt-1 break-all">TrxID: <strong>{item.transactionId}</strong></div>}
                  {item.senderNumber && <div className="mt-1">Sender: <strong>{item.senderNumber}</strong></div>}
                  {item.reviewNote && <div className="mt-1 text-rose-700">Note: {item.reviewNote}</div>}
                </div>
              )}
              {subscriptionReviewActions(item) && <div className="mt-3">{subscriptionReviewActions(item)}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );

  // Registration chart geometry
  const weekly = overview?.weeklyRegistrations || [];
  const peak = Math.max(0, ...weekly.map((d) => d.count));
  const step = Math.max(1, Math.ceil(Math.max(4, peak) / 4));
  const top = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((i) => i * step);
  const weeklyTotal = weekly.reduce((sum, d) => sum + d.count, 0);

  const totalSubs = stats?.totalSubscriptions || 0;
  const activeSubs = stats?.activeSubscriptions || 0;
  const pendingSubs = stats?.pendingPayments || 0;
  const otherSubs = Math.max(0, totalSubs - activeSubs - pendingSubs);
  const pct = (n: number) =>
    `${totalSubs ? Math.min(100, (n / totalSubs) * 100) : 0}%`;

  const filterForm = (opts: {
    value: string;
    setValue: (v: string) => void;
    apply: () => void;
    placeholder: string;
    status: string;
    setStatus: (v: string) => void;
    options: [string, string][];
    label: string;
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        opts.apply();
      }}
      className="flex flex-col gap-2 px-5 py-4 sm:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={opts.value}
          onChange={(e) => opts.setValue(e.target.value)}
          placeholder={opts.placeholder}
          aria-label={opts.placeholder}
          className={`${INPUT} w-full pl-9 pr-3`}
        />
      </div>
      <select
        value={opts.status}
        onChange={(e) => opts.setStatus(e.target.value)}
        aria-label="Filter"
        className={`${INPUT} cursor-pointer px-3 font-medium`}
      >
        {opts.options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={`h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 ${FOCUS}`}
      >
        {opts.label}
      </button>
    </form>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-slate-900/20 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:translate-x-0 ${mobileNavOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <ShieldCheck size={19} strokeWidth={1.9} />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-slate-900">
              {siteSettings.branding.siteName || "Website"}
            </div>
            <div className="text-xs text-slate-500">Admin workspace</div>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className={`ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden ${FOCUS}`}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 pt-5"
          aria-label="Admin navigation"
        >
          <div className="px-3 pb-2 text-xs font-medium text-slate-400">
            Workspace
          </div>
          <div className="space-y-0.5">
            {navItems.map(({ key, label, icon: Icon, badgeCount }) => {
              const on = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => selectTab(key)}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${FOCUS} ${on ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                >
                  {on && (
                    <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-indigo-600" />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={on ? "text-indigo-600" : "text-slate-400"}
                  />
                  <span className="min-w-0 flex-1">{label}</span>
                  {badgeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Online now
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {activeCount}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5">
            <Avatar name={displayName} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-900">
                {displayName}
              </div>
              <div className="truncate text-xs text-slate-500">
                {admin?.email || "Administrator"}
              </div>
            </div>
            <button
              onClick={() => void logOut()}
              className={`rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 ${FOCUS}`}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen md:pl-[256px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className={`rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 md:hidden ${FOCUS}`}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-xs text-slate-500">
                Administration / {navItems.find((i) => i.key === tab)?.label}
              </div>
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900">
                {pageTitle}
              </h1>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm text-slate-500 lg:inline">
              {admin?.email}
            </span>
            <button
              onClick={() => void refreshCurrent()}
              disabled={refreshing}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-indigo-700 disabled:opacity-60 ${FOCUS}`}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {globalError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              <Activity size={17} className="mt-0.5 shrink-0" />
              <div className="flex-1">{globalError}</div>
              <button
                onClick={() => void loadOverview()}
                className="cursor-pointer text-sm font-medium underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Welcome back, {displayName.split(" ")[0]}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Users, activity and subscription performance at a glance.
                  </p>
                </div>
                {overview?.generatedAt && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 size={13} />
                    Updated {formatDate(overview.generatedAt, true)}
                  </p>
                )}
              </div>

              <section aria-label="Key metrics" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total registered users"
                    value={num(stats?.totalUsers)}
                    detail="All accounts on the platform"
                    icon={Users}
                    tint="bg-indigo-50 text-indigo-600"
                  />
                  <StatCard
                    title="Users active now"
                    value={num(stats?.activeNow)}
                    detail="Live connection status"
                    icon={Activity}
                    tint="bg-emerald-50 text-emerald-600"
                  />
                  <StatCard
                    title="Logged in today"
                    value={num(stats?.loginsToday)}
                    detail="Bangladesh time"
                    icon={LogIn}
                    tint="bg-sky-50 text-sky-600"
                  />
                  <StatCard
                    title="Active subscribers"
                    value={num(stats?.activeSubscribers)}
                    detail={`${(stats?.activeSubscriptions || 0).toLocaleString("en-BD")} active subscription records`}
                    icon={BadgeCheck}
                    tint="bg-violet-50 text-violet-600"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    title="Subscription records"
                    value={num(stats?.totalSubscriptions)}
                    detail="All recorded purchases"
                    icon={ReceiptText}
                    tint="bg-slate-100 text-slate-600"
                  />
                  <StatCard
                    title="Recorded revenue"
                    value={overviewLoading ? "—" : money(stats?.totalRevenue)}
                    detail="Total of recorded subscription amounts"
                    icon={CircleDollarSign}
                    tint="bg-indigo-50 text-indigo-600"
                  />
                  <StatCard
                    title="Pending payments"
                    value={num(stats?.pendingPayments)}
                    detail="Awaiting payment confirmation"
                    icon={Clock3}
                    tint="bg-amber-50 text-amber-600"
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
                <article className={`${CARD} p-5 sm:p-6`}>
                  <PanelHeading
                    title="Registration activity"
                    description="New accounts created over the last 7 days."
                    action={
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {weeklyTotal.toLocaleString("en-BD")} total
                      </span>
                    }
                  />
                  {weekly.length === 0 || weeklyTotal === 0 ? (
                    <EmptyState
                      icon={BarChart3}
                      title="No new registrations this week"
                      hint="Sign-ups from the last 7 days will be charted here."
                    />
                  ) : (
                    <div className="mt-6 flex gap-3">
                      <div
                        className="relative flex h-[200px] flex-col justify-between pb-[1px] text-right text-xs text-slate-400 tabular-nums"
                        aria-hidden="true"
                      >
                        {ticks.map((t) => (
                          <span key={t} className="leading-none">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="relative h-[200px]"
                          role="img"
                          aria-label={`Registrations over the last 7 days: ${weekly.map((d) => `${d.label} ${d.count}`).join(", ")}`}
                        >
                          <div
                            className="absolute inset-0 flex flex-col justify-between"
                            aria-hidden="true"
                          >
                            {ticks.map((t) => (
                              <div
                                key={t}
                                className={`h-px w-full ${t === 0 ? "bg-slate-300" : "bg-slate-100"}`}
                              />
                            ))}
                          </div>
                          <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4">
                            {weekly.map((day, i) => (
                              <div
                                key={day.date}
                                className="relative flex h-full flex-1 items-end justify-center"
                                onMouseEnter={() => setHoverBar(i)}
                                onMouseLeave={() => setHoverBar(null)}
                              >
                                {hoverBar === i && (
                                  <div
                                    className="pointer-events-none absolute z-10 -translate-y-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
                                    style={{
                                      bottom: `calc(${(day.count / top) * 100}% + 6px)`,
                                    }}
                                  >
                                    <span className="font-semibold text-slate-900">
                                      {day.count}
                                    </span>{" "}
                                    <span className="text-slate-500">
                                      {day.count === 1
                                        ? "registration"
                                        : "registrations"}{" "}
                                      · {formatDate(day.date)}
                                    </span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  tabIndex={0}
                                  onFocus={() => setHoverBar(i)}
                                  onBlur={() => setHoverBar(null)}
                                  aria-label={`${day.label}: ${day.count} registrations`}
                                  className={`w-full max-w-[36px] rounded-t-md transition-colors ${FOCUS} ${hoverBar === i ? "bg-indigo-600" : "bg-indigo-500"}`}
                                  style={{
                                    height: `${(day.count / top) * 100}%`,
                                    minHeight: day.count ? 4 : 0,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between gap-2 sm:gap-4">
                          {weekly.map((day) => (
                            <span
                              key={day.date}
                              className="flex-1 text-center text-xs text-slate-500"
                            >
                              {day.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </article>

                <article className={`${CARD} p-5 sm:p-6`}>
                  <PanelHeading
                    title="Subscription status"
                    description="How recorded subscriptions are split today."
                  />
                  {totalSubs === 0 ? (
                    <EmptyState
                      icon={CreditCard}
                      title="No subscriptions yet"
                      hint="Status breakdown appears after the first purchase."
                    />
                  ) : (
                    <div className="mt-5 space-y-5">
                      <div
                        className="flex h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="img"
                        aria-label={`${activeSubs} active, ${pendingSubs} pending, ${otherSubs} other of ${totalSubs}`}
                      >
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: pct(activeSubs) }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: pct(pendingSubs) }}
                        />
                        <div
                          className="h-full bg-slate-300 transition-all"
                          style={{ width: pct(otherSubs) }}
                        />
                      </div>
                      <ul className="divide-y divide-slate-100 text-sm">
                        {[
                          {
                            label: "Active",
                            n: activeSubs,
                            dot: "bg-emerald-500",
                          },
                          {
                            label: "Pending payment",
                            n: pendingSubs,
                            dot: "bg-amber-400",
                          },
                          {
                            label: "Other statuses",
                            n: otherSubs,
                            dot: "bg-slate-300",
                          },
                        ].map((row) => (
                          <li
                            key={row.label}
                            className="flex items-center justify-between py-2.5"
                          >
                            <span className="flex items-center gap-2.5 text-slate-600">
                              <span
                                className={`h-2.5 w-2.5 rounded-sm ${row.dot}`}
                              />
                              {row.label}
                            </span>
                            <span className="flex items-baseline gap-2">
                              <span className="font-semibold text-slate-900 tabular-nums">
                                {row.n.toLocaleString("en-BD")}
                              </span>
                              <span className="w-10 text-right text-xs text-slate-500 tabular-nums">
                                {Math.round((row.n / totalSubs) * 100)}%
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => selectTab("subscriptions")}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700 ${FOCUS}`}
                      >
                        Review subscriptions <ChevronRight size={15} />
                      </button>
                    </div>
                  )}
                </article>
              </section>

              <section className={`${CARD} overflow-hidden`}>
                <div className="p-5 pb-4 sm:px-6 sm:pt-6">
                  <PanelHeading
                    title="Recently registered users"
                    description="Newest accounts, with contact details and latest activity."
                    action={
                      <button
                        onClick={() => selectTab("users")}
                        className={`inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-700 ${FOCUS}`}
                      >
                        View all users <ChevronRight size={15} />
                      </button>
                    }
                  />
                </div>
                {overviewLoading && !overview ? (
                  <LoadingRows />
                ) : overview?.recentUsers?.length ? (
                  userRows(overview.recentUsers)
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No users have registered yet"
                    hint="New accounts will show up here."
                  />
                )}
              </section>

              <section className={`${CARD} overflow-hidden`}>
                <div className="p-5 pb-4 sm:px-6 sm:pt-6">
                  <PanelHeading
                    title="Latest subscriptions"
                    description="Recent purchases with payment and access status."
                    action={
                      <button
                        onClick={() => selectTab("subscriptions")}
                        className={`inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-700 ${FOCUS}`}
                      >
                        View all <ChevronRight size={15} />
                      </button>
                    }
                  />
                </div>
                {overviewLoading && !overview ? (
                  <LoadingRows />
                ) : overview?.recentSubscriptions?.length ? (
                  subscriptionRows(overview.recentSubscriptions)
                ) : (
                  <EmptyState
                    icon={CreditCard}
                    title="No subscriptions recorded yet"
                    hint="Purchases will show up here."
                  />
                )}
              </section>

              <section className={`${CARD} p-5 sm:p-6`}>
                <PanelHeading
                  title="Recent login activity"
                  description="Latest successful login for each account."
                />
                {overview?.recentLogins?.length ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {overview.recentLogins.map((user) => (
                      <div
                        key={user.id}
                        className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                      >
                        <Avatar name={user.fullName} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {user.fullName || "Unnamed user"}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {user.email}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {formatDate(user.lastLoginAt, true)}
                          </div>
                        </div>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${user.isOnline ? "bg-emerald-500" : "bg-slate-300"}`}
                          title={user.isOnline ? "Online" : "Offline"}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={LogIn}
                    title="No logins recorded yet"
                    hint="Successful logins will appear here after users sign in."
                  />
                )}
              </section>
            </div>
          )}

          {tab === "users" && (
            <section className={`${CARD} overflow-hidden`}>
              <div className="p-5 pb-0 sm:px-6 sm:pt-6">
                <PanelHeading
                  title="All users"
                  description="Live online status updates automatically. A lost connection is marked offline when its heartbeat expires."
                  action={
                    <StatusPill
                      label={`${userPagination.total.toLocaleString("en-BD")} accounts`}
                      tone="indigo"
                    />
                  }
                />
              </div>
              {filterForm({
                value: userSearch,
                setValue: setUserSearch,
                apply: () => setAppliedUserSearch(userSearch),
                placeholder: "Search name, email or phone",
                status: userStatus,
                setStatus: setUserStatus,
                options: [
                  ["all", "All users"],
                  ["online", "Online now"],
                  ["offline", "Offline"],
                  ["subscribed", "Active subscribers"],
                ],
                label: "Search",
              })}
              {usersError && (
                <div
                  role="alert"
                  className="mx-5 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {usersError}
                </div>
              )}
              {usersNotice && (
                <div
                  role="status"
                  className="mx-5 mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                >
                  {usersNotice}
                </div>
              )}
              {usersLoading ? (
                <LoadingRows />
              ) : users.length ? (
                userRows(users)
              ) : (
                <EmptyState
                  icon={Users}
                  title="No users match this search"
                  hint="Try a different name, email, phone number or filter."
                />
              )}
              <Pager
                p={userPagination}
                loading={usersLoading}
                onGo={(page) => void loadUsers(page)}
              />
            </section>
          )}

          {tab === "subscriptions" && (
            <section className={`${CARD} overflow-hidden`}>
              <div className="p-5 pb-0 sm:px-6 sm:pt-6">
                <PanelHeading
                  title="Subscription records"
                  description="Purchase details, payment results, account details and expiry."
                  action={
                    <StatusPill
                      label={`${subscriptionPagination.total.toLocaleString("en-BD")} records`}
                      tone="indigo"
                    />
                  }
                />
              </div>
              {filterForm({
                value: subscriptionSearch,
                setValue: setSubscriptionSearch,
                apply: () => setAppliedSubscriptionSearch(subscriptionSearch),
                placeholder: "Search customer name, email or phone",
                status: subscriptionStatus,
                setStatus: setSubscriptionStatus,
                options: [
                  ["all", "All statuses"],
                  ["active", "Active"],
                  ["expired", "Expired"],
                  ["pending", "Pending payment"],
                  ["cancelled", "Cancelled"],
                  ["error", "Payment errors"],
                  ["rejected", "Rejected payments"],
                ],
                label: "Search",
              })}
              {(subscriptionsError || reviewActionError) && (
                <div
                  role="alert"
                  className="mx-5 mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {reviewActionError || subscriptionsError}
                </div>
              )}
              {subscriptionsLoading ? (
                <LoadingRows />
              ) : subscriptions.length ? (
                subscriptionRows(subscriptions)
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No subscriptions match these filters"
                  hint="Try a different search or status."
                />
              )}
              <Pager
                p={subscriptionPagination}
                loading={subscriptionsLoading}
                onGo={(page) => void loadSubscriptions(page)}
              />
            </section>
          )}

          {tab === "chats" && <AdminChatsPanel refreshKey={chatRefreshKey} />}
          {tab === "live" && <AdminLivePanel refreshKey={liveRefreshKey} />}
          {tab === "settings" && <SiteSettingsPanel />}

          {accessModalUser && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
              onClick={() => {
                if (!accessSaving && !userDeleting && !userActionBusy) setAccessModalUser(null);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="manual-access-title"
                className="relative max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close access management"
                  disabled={accessSaving || userDeleting || userActionBusy}
                  onClick={() => setAccessModalUser(null)}
                  className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={18} />
                </button>

                <div className="pr-8">
                  <h2 id="manual-access-title" className="text-lg font-semibold text-slate-900">
                    Manage user account
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {accessModalUser.fullName || "Unnamed user"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {accessModalUser.email || accessModalUser.phoneNumber || accessModalUser.id}
                  </p>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Account security and permissions</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill
                      label={accessModalUser.role === "admin" ? "Administrator" : "Regular user"}
                      tone={accessModalUser.role === "admin" ? "indigo" : "slate"}
                    />
                    {accessModalUser.isPrimaryAdmin && <StatusPill label="Primary administrator" tone="indigo" />}
                    {accessModalUser.isBanned && <StatusPill label="Tool access blocked" tone="red" />}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {accessModalUser.role !== "admin" && (
                      <button
                        type="button"
                        disabled={userActionBusy || userDeleting || confirmingUserDelete}
                        onClick={() => void performUserAction(accessModalUser.isBanned ? "unban" : "ban")}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${accessModalUser.isBanned ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
                      >
                        {accessModalUser.isBanned ? <Unlock size={15} /> : <Ban size={15} />}
                        {userActionBusy ? "Saving…" : accessModalUser.isBanned ? "Restore tool access" : "Block all tools"}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={userActionBusy || userDeleting || confirmingUserDelete || accessModalUser.isPrimaryAdmin === true || accessModalUser.id === admin?.id || (accessModalUser.role === "admin" && !admin?.isRootAdmin)}
                      onClick={() => void performUserAction("reset-password")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <KeyRound size={15} /> Reset password
                    </button>

                    {admin?.isRootAdmin && accessModalUser.id !== admin.id && accessModalUser.isPrimaryAdmin !== true && (
                      <button
                        type="button"
                        disabled={userActionBusy || userDeleting || confirmingUserDelete}
                        onClick={() => void performUserAction(accessModalUser.role === "admin" ? "remove-admin" : "grant-admin")}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserCog size={15} />
                        {accessModalUser.role === "admin" ? "Remove admin role" : "Grant admin role"}
                      </button>
                    )}
                  </div>

                  {accessModalUser.role === "admin" && !admin?.isRootAdmin && (
                    <p className="mt-3 text-xs leading-5 text-slate-500">Only the primary administrator can modify another administrator account or reset its password.</p>
                  )}

                  {temporaryPassword && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                      <p className="text-sm font-semibold text-emerald-900">Temporary password generated</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-800">Copy it now and share it with the user through a private channel. It will not be shown again after this modal closes.</p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">{temporaryPassword}</code>
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.clipboard?.writeText) {
                              setUserActionError("Clipboard access is unavailable. Select the password and copy it manually.");
                              return;
                            }
                            void navigator.clipboard.writeText(temporaryPassword).then(() => setTemporaryPasswordCopied(true)).catch(() => setUserActionError("Could not copy automatically. Select the password and copy it manually."));
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Copy size={14} /> {temporaryPasswordCopied ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                  {userActionError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">{userActionError}</p>}
                </div>

                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><Trash2 size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">Delete user account permanently</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Permanently removes this account and its subscription, chat history, saved files and other user-owned database records. This cannot be undone.</p>
                      {(accessModalUser.role === "admin" || accessModalUser.isPrimaryAdmin === true) && <p className="mt-2 text-xs font-medium text-amber-700">Administrator accounts are protected. Remove an ordinary admin role before deletion; the primary administrator cannot be deleted here.</p>}
                    </div>
                  </div>
                  {!confirmingUserDelete ? (
                    <button
                      type="button"
                      disabled={accessSaving || userDeleting || accessModalUser.role === "admin" || accessModalUser.isPrimaryAdmin === true}
                      onClick={() => { setConfirmingUserDelete(true); setDeleteUserConfirmationText(""); setDeleteUserError(""); }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={15} /> Delete account and all associated data
                    </button>
                  ) : (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                      <p className="text-sm font-semibold text-rose-800">Confirm permanent deletion</p>
                      <p className="mt-1 text-xs leading-5 text-rose-700">To continue, type <strong>DELETE</strong> below. Payment records and messages will also be removed.</p>
                      <input
                        value={deleteUserConfirmationText}
                        onChange={(event) => { setDeleteUserConfirmationText(event.target.value); setDeleteUserError(""); }}
                        autoComplete="off"
                        disabled={userDeleting}
                        aria-label="Type DELETE to confirm account deletion"
                        placeholder="Type DELETE"
                        className="mt-3 w-full rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-100"
                      />
                      {deleteUserError && <p role="alert" className="mt-2 text-xs font-medium text-rose-700">{deleteUserError}</p>}
                      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button type="button" disabled={userDeleting || userActionBusy} onClick={() => { setConfirmingUserDelete(false); setDeleteUserConfirmationText(""); setDeleteUserError(""); }} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                        <button type="button" disabled={userDeleting || userActionBusy || accessModalUser.role === "admin" || accessModalUser.isPrimaryAdmin === true || deleteUserConfirmationText !== "DELETE"} onClick={() => void deleteUserAccount()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                          <Trash2 size={14} /> {userDeleting ? "Deleting account…" : "Permanently delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {accessModalUser.manualAccess?.isActive ? (
                    <>
                      <div className="flex items-center gap-2">
                        <StatusPill label="Manual access active" tone="green" />
                      </div>
                      <p className="mt-2 text-sm text-slate-700">
                        Current access ends on <strong>{formatDate(accessModalUser.manualAccess.expiresAt, true)}</strong>.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Granting more time adds the selected duration after the current expiry.
                      </p>
                    </>
                  ) : accessModalUser.manualAccess?.enabled ? (
                    <p className="text-sm text-amber-800">
                      The previous manual access has expired. Granting access will start a new period from now.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600">
                      This user does not currently have an active manual access grant.
                    </p>
                  )}
                </div>

                <label htmlFor="manual-access-duration" className="mt-5 block text-sm font-medium text-slate-700">
                  Access duration
                </label>
                <select
                  id="manual-access-duration"
                  value={accessDurationMonths}
                  onChange={(event) => setAccessDurationMonths(event.target.value)}
                  disabled={accessSaving || userDeleting || userActionBusy || confirmingUserDelete}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-100"
                >
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">1 year</option>
                </select>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Manual access does not mark a payment as completed or create a subscription record. The user’s payment history and revenue totals remain unchanged.
                </p>

                {accessError && (
                  <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {accessError}
                  </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  {accessModalUser.manualAccess?.enabled ? (
                    <button
                      type="button"
                      disabled={accessSaving || userDeleting || userActionBusy || confirmingUserDelete}
                      onClick={() => void updateManualAccess("revoke")}
                      className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {accessSaving ? "Saving…" : "Revoke manual access"}
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={accessSaving || userDeleting || userActionBusy}
                      onClick={() => setAccessModalUser(null)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={accessSaving || userDeleting || userActionBusy || confirmingUserDelete}
                      onClick={() => void updateManualAccess("grant")}
                      className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {accessSaving
                        ? "Saving…"
                        : accessModalUser.manualAccess?.isActive
                          ? `Extend ${accessDurationMonths} month${accessDurationMonths === "1" ? "" : "s"}`
                          : `Grant ${accessDurationMonths} month${accessDurationMonths === "1" ? "" : "s"}`}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          <footer className="flex flex-col gap-2 pt-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Sohozkaj</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} /> Admin access is verified on the server
            </span>
          </footer>
        </div>
      </div>
    </main>
  );
}
