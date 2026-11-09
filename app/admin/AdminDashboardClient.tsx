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
  Check,
  CalendarClock,
  CircleDollarSign,
  Copy,
  Clock3,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Mail,
  Menu,
  MessageCircle,
  Percent,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Settings2,
  Trash2,
  TrendingUp,
  Unlock,
  UserCog,
  UserPlus,
  Users,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import { getClientAuthHeaders, logoutClientSession } from "@/lib/clientAuth";
import AdminChatsPanel from "./_components/AdminChatsPanel";
import AdminGenerationPanel from "./_components/AdminGenerationPanel";
import OverviewInsights, { type OverviewInsightsData } from "./_components/OverviewInsights";
import SiteSettingsPanel from "./_components/SiteSettingsPanel";
import PaymentGatewaySettingsPanel from "./_components/PaymentGatewaySettingsPanel";
import UddoktaPaySettingsPanel from "./_components/UddoktaPaySettingsPanel";
import SmtpSettingsPanel from "./_components/SmtpSettingsPanel";
import MailCampaignPanel from "./_components/MailCampaignPanel";
import SubscriptionPlansPanel from "./_components/SubscriptionPlansPanel";
import SubscriptionActivityPanel from "./_components/SubscriptionActivityPanel";
import BotStatusPanel from "./_components/BotStatusPanel";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import "./admin-theme.css";
import { visibleInterval } from "@/app/_lib/visiblePolling";

type TabKey = "overview" | "users" | "subscriptions" | "chats" | "generations" | "settings" | "payment-gateway" | "smtp" | "subscription-plans" | "subscription-activity" | "bot-status";
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
function subscriptionDurationLabel(planId: string, months: number, planDays = 0) {
  if (Number.isInteger(planDays) && planDays > 0) {
    if (planDays === 365 && months === 12) return "1 year";
    if (planDays === 180 && months === 6) return "6 months";
    if (planDays === 30 && months === 1) return "1 month";
    if (planDays % 365 === 0) return `${planDays / 365} years`;
    if (planDays % 30 === 0) return `${planDays / 30} months`;
    return `${planDays} ${planDays === 1 ? "day" : "days"}`;
  }
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
  planDays?: number;
  amount: number;
  invoiceId: string;
  paymentProvider?: string;
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
    newToday: number;
    newThisMonth: number;
    weeklyRegistrations: number;
    previousWeekRegistrations: number;
    weeklyGrowthPercent: number | null;
    neverLoggedIn: number;
    bannedUsers: number;
    paidConversionPercent: number;
    revenueThisMonth: number;
    expiringSoon: number;
    topDistrict: { name: string; users: number } | null;
  };
  weeklyRegistrations: { date: string; label: string; count: number }[];
  insights?: OverviewInsightsData | null;
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
  "rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]";
const FOCUS =
  "cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#FBF6E8]";
const INPUT = `h-10 rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] text-sm text-[#3B2F1E] outline-none transition placeholder:text-[#A8987A] hover:border-[#B8A57C] focus:border-[#DC2626] focus:ring-4 focus:ring-[#DC2626]/10`;
const TH = "px-5 py-3 text-[12px] font-semibold text-[#7A6A50]";

const PILL: Record<Tone, { box: string; dot: string }> = {
  green: {
    box: "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
    dot: "bg-emerald-500",
  },
  amber: {
    box: "bg-[#FDF1D0] text-[#8A5A00] ring-[#F2B93B]/60",
    dot: "bg-[#E8A317]",
  },
  red: {
    box: "bg-[#FEE9E9] text-[#B91C1C] ring-[#DC2626]/25",
    dot: "bg-[#DC2626]",
  },
  // "indigo" is kept as the key for informational / brand pills (now espresso + gold).
  indigo: {
    box: "bg-[#F2E8D2] text-[#3B2F1E] ring-[#D8C9A6]",
    dot: "bg-[#F2B93B]",
  },
  slate: {
    box: "bg-[#EFE5CE] text-[#5A4A32] ring-[#D8C9A6]",
    dot: "bg-[#A8987A]",
  },
};

// Left status stripe on table rows: colour = how the record is doing.
const STRIPE: Record<Tone, string> = {
  green: "shadow-[inset_4px_0_0_0_#10B981]",
  amber: "shadow-[inset_4px_0_0_0_#F2B93B]",
  red: "shadow-[inset_4px_0_0_0_#DC2626]",
  indigo: "shadow-[inset_4px_0_0_0_#5A4A32]",
  slate: "shadow-[inset_4px_0_0_0_#D8C9A6]",
};

function StatusPill({ label, tone = "slate" }: { label: string; tone?: Tone }) {
  const t = PILL[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${t.box}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

function titleCase(value?: string) {
  const v = (value || "").trim().replace(/_/g, " ");
  if (!v) return "Unknown";
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

// Human description of how long an access period has left (or how long ago it ended).
function expiryInfo(expiresAt?: string | null): {
  text: string;
  tone: "ok" | "soon" | "gone" | "none";
} {
  if (!expiresAt) return { text: "", tone: "none" };
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return { text: "", tone: "none" };
  const diff = end - Date.now();
  if (diff > 0) {
    const days = Math.ceil(diff / 86_400_000);
    return {
      text: days === 1 ? "1 day left" : `${days} days left`,
      tone: days <= 3 ? "soon" : "ok",
    };
  }
  const days = Math.floor(-diff / 86_400_000);
  return {
    text: days < 1 ? "Expired today" : `Expired ${days} day${days === 1 ? "" : "s"} ago`,
    tone: "gone",
  };
}

const EXPIRY_TEXT: Record<"ok" | "soon" | "gone" | "none", string> = {
  ok: "text-emerald-700",
  soon: "text-[#B45309]",
  gone: "text-[#B91C1C]",
  none: "text-[#7A6A50]",
};

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
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-[#DC2626]"
        />
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#3B2F1E]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[#7A6A50]">
              {description}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

const AVATAR_TONES = [
  "bg-[#3B2F1E] text-[#F2B93B] ring-[#5A4A32]",
  "bg-[#FEE9E9] text-[#B91C1C] ring-[#FBB6B6]",
  "bg-[#FDF1D0] text-[#8A5A00] ring-[#F2B93B]/50",
  "bg-emerald-50 text-emerald-800 ring-emerald-600/25",
  "bg-[#F2E8D2] text-[#5A4A32] ring-[#D8C9A6]",
];

function Avatar({ name, size = "md" }: { name?: string; size?: "sm" | "md" }) {
  let hash = 0;
  for (const ch of name || "U") hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-[13px]"}`}
    >
      {initials(name)}
    </span>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={() => {
        if (!navigator.clipboard?.writeText) return;
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => undefined);
      }}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#A8987A] transition hover:bg-[#EFE5CE] hover:text-[#3B2F1E] ${FOCUS}`}
    >
      {copied ? (
        <Check size={12} className="text-emerald-600" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-baseline gap-2">
      <dt className="text-[11px] font-medium text-[#7A6A50]">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1 text-[12.5px] font-medium text-[#3B2F1E]">
        {children}
      </dd>
    </div>
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
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E3D6B8] bg-[#F2E8D2] text-[#A8987A]">
        <Icon size={20} strokeWidth={1.7} />
      </span>
      <p className="mt-3 text-sm font-semibold text-[#3B2F1E]">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-[#7A6A50]">{hint}</p>}
    </div>
  );
}

function LoadingRows() {
  return (
    <div
      className="divide-y divide-[#EFE5CE]"
      aria-busy="true"
      aria-label="Loading"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <span className="h-10 w-10 animate-pulse rounded-full bg-[#EFE5CE]" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-1/3 animate-pulse rounded bg-[#EFE5CE]" />
            <span className="block h-3 w-1/2 animate-pulse rounded bg-[#EFE5CE]/70" />
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
  const btn = `flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] text-[#5A4A32] transition hover:border-[#3B2F1E] hover:bg-[#F2E8D2] disabled:opacity-40 disabled:hover:border-[#D8C9A6] disabled:hover:bg-[#FFFDF6] ${FOCUS}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3D6B8] bg-[#F6EEDB] px-5 py-3.5 text-sm text-[#7A6A50]">
      <span>
        Showing{" "}
        <span className="font-semibold text-[#3B2F1E]">
          {from}–{to}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[#3B2F1E]">
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
        <span className="min-w-[56px] text-center text-sm font-semibold text-[#3B2F1E]">
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
  const [subscriptionPlansRefreshKey, setSubscriptionPlansRefreshKey] = useState(0);
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
    const stopPolling = visibleInterval(() => void refreshUnreadCount(), 30_000);
    return () => {
      active = false;
      stopPolling();
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

  const loginAsUser = async () => {
    const target = accessModalUser;
    if (!target || userActionBusy) return;
    if (
      !window.confirm(
        `Log in as ${target.fullName || target.email}? You will see their account exactly as they do. This is logged, stays open while you're actively using it, and ends automatically if left idle or after 12 hours.`,
      )
    ) {
      return;
    }

    setUserActionBusy(true);
    setUserActionError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(target.id)}/impersonate`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Could not start a session as this user.");
      }
      // The response already swapped the session cookie to the user's account;
      // leave the admin workspace so the next page load reflects that session.
      window.location.href = "/";
    } catch (error) {
      setUserActionError(error instanceof Error ? error.message : "Could not start a session as this user.");
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
    const canReview = item.paymentStatus === "PENDING" && Boolean(item.transactionId) && ["Nagad", "bKash"].includes(item.paymentMethod) && (!item.paymentProvider || item.paymentProvider === "Manual");
    const active = subscriptionTones(item).active;
    const reviewBusy = reviewingSubscriptionId === item.id;
    const deactivateBusy = subscriptionActionBusyId === item.id;
    const deleteBusy = subscriptionDeleteBusyId === item.id;
    const busy = Boolean(reviewingSubscriptionId) || Boolean(subscriptionActionBusyId) || Boolean(subscriptionDeleteBusyId);
    const base = `inline-flex h-8 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
    return (
      <div className="flex w-full min-w-[150px] flex-col items-stretch gap-1.5">
        {canReview && (
          <>
            <button type="button" disabled={busy} onClick={() => void reviewSubscription(item, "approve")}
              className={`${base} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`}>
              <Check size={13} /> {reviewBusy ? "Please wait…" : "Approve payment"}
            </button>
            <button type="button" disabled={busy} onClick={() => void reviewSubscription(item, "reject")}
              className={`${base} border border-[#F3C6C6] bg-[#FFFDF6] text-[#B91C1C] hover:bg-[#FEE9E9]`}>
              <X size={13} /> Reject
            </button>
          </>
        )}
        {active && (
          <button type="button" disabled={busy} onClick={() => void deactivateSubscription(item)}
            className={`${base} border border-[#F2B93B]/70 bg-[#FFFDF6] text-[#8A5A00] hover:bg-[#FDF1D0]`}>
            <Ban size={13} /> {deactivateBusy ? "Deactivating…" : "Deactivate access"}
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => void deleteSubscriptionRecord(item)}
          title="Permanently delete this subscription record"
          className={`${base} border border-[#F3C6C6] bg-[#FFFDF6] text-[#B91C1C] hover:bg-[#FEE9E9]`}>
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
        key: "generations" as const,
        label: "Generation Activity",
        icon: ShieldAlert,
        badgeCount: 0,
      },
      {
        key: "settings" as const,
        label: "Site Settings",
        icon: Settings2,
        badgeCount: 0,
      },
      {
        key: "payment-gateway" as const,
        label: "Payment Gateway",
        icon: KeyRound,
        badgeCount: 0,
      },
      {
        key: "smtp" as const,
        label: "Email & SMTP",
        icon: Mail,
        badgeCount: 0,
      },
      {
        key: "subscription-plans" as const,
        label: "Subscription Plans",
        icon: Percent,
        badgeCount: 0,
      },
      {
        key: "subscription-activity" as const,
        label: "Subscription Activity",
        icon: Users,
        badgeCount: 0,
      },
      {
        key: "bot-status" as const,
        label: "Bot Status",
        icon: Activity,
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
            : tab === "generations"
              ? "Image generation activity"
              : tab === "payment-gateway"
              ? "Payment gateway configuration"
              : tab === "smtp"
                ? "Email & SMTP"
                : tab === "subscription-plans"
                  ? "Subscription plan controls"
                  : tab === "subscription-activity"
                    ? "Subscription activity"
                    : tab === "bot-status"
                      ? "Image bot status"
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
    else if (tab === "settings") router.refresh();
    else if (tab === "subscription-plans") setSubscriptionPlansRefreshKey((current) => current + 1);
    else await loadOverview();
    setRefreshing(false);
  };

  const logOut = async () => {
    await logoutClientSession();
    router.replace("/login");
  };

  if (booting || !authorized) {
    return (
      <main className="admin-theme flex min-h-screen items-center justify-center bg-[#EFE5CE] px-4">
        <div className={`${CARD} flex items-center gap-3 px-5 py-4`}>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
          <span className="text-sm font-medium text-[#5A4A32]">
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#7A6A50]">{title}</p>
          <p className="mt-2.5 text-[30px] font-semibold leading-none tracking-tight text-[#3B2F1E] tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      {detail && (
        <p className="mt-4 border-t border-[#EFE5CE] pt-3 text-xs text-[#7A6A50]">
          {detail}
        </p>
      )}
    </article>
  );

  const openManage = (user: UserRow) => {
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
  };

  const manageButtonClass = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B2F1E] px-3 py-2 text-xs font-semibold text-[#FBF6E8] shadow-sm transition hover:bg-[#5A4A32] ${FOCUS}`;

  const userRows = (rows: UserRow[]) => (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto min-[1340px]:block">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-y border-[#E3D6B8] bg-[#F2E8D2]">
              <th className={TH}>User</th>
              <th className={TH}>Contact</th>
              <th className={TH}>Status</th>
              <th className={TH}>Subscription</th>
              <th className={TH}>Activity</th>
              {tab === "users" && <th className={TH}>Access control</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE5CE]">
            {rows.map((user) => {
              const stripe: Tone = user.isBanned
                ? "red"
                : user.isOnline
                  ? "green"
                  : "slate";
              const subExpiry = expiryInfo(user.subscription?.expiresAt);
              return (
                <tr
                  key={user.id}
                  className="align-top transition-colors hover:bg-[#F6EEDB]"
                >
                  <td className={`px-5 py-4 ${STRIPE[stripe]}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} />
                      <div className="min-w-0">
                        <div className="max-w-[200px] truncate text-sm font-semibold text-[#3B2F1E]">
                          {user.fullName || "Unnamed user"}
                        </div>
                        <div className="mt-1">
                          {user.role === "admin" ? (
                            <StatusPill label="Administrator" tone="indigo" />
                          ) : (
                            <span className="text-xs text-[#7A6A50]">Regular user</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-[#3B2F1E]">
                      <Mail size={13} className="shrink-0 text-[#A8987A]" />
                      <span className="max-w-[230px] truncate">{user.email || "—"}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7A6A50] tabular-nums">
                      <Phone size={12} className="shrink-0 text-[#A8987A]" />
                      {user.phoneNumber || "No phone"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      {user.isBanned && <StatusPill label="Tools blocked" tone="red" />}
                      {user.isOnline ? (
                        <StatusPill label="Online now" tone="green" />
                      ) : (
                        <StatusPill label="Offline" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-2.5">
                      {user.subscription ? (
                        <div>
                          <StatusPill label="Paid plan active" tone="green" />
                          <p className="mt-1.5 text-xs font-semibold text-[#3B2F1E]">
                            {user.subscription.planName}
                          </p>
                          <p className="text-xs text-[#7A6A50]">
                            Until {formatDate(user.subscription.expiresAt)}
                            {subExpiry.text && (
                              <span className={`ml-1 font-semibold ${EXPIRY_TEXT[subExpiry.tone]}`}>
                                · {subExpiry.text}
                              </span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-[#A8987A]">
                          {user.manualAccess?.isActive ? "No paid plan" : "No active plan"}
                        </span>
                      )}
                      {user.manualAccess?.isActive && (
                        <div>
                          <StatusPill label="Admin access active" tone="indigo" />
                          <p className="mt-1 text-xs text-[#7A6A50]">
                            Until {formatDate(user.manualAccess.expiresAt)}
                          </p>
                        </div>
                      )}
                      {user.manualAccess?.enabled && !user.manualAccess.isActive && (
                        <StatusPill label="Manual access expired" tone="amber" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-[#3B2F1E]">
                      {formatDate(user.lastLoginAt, true)}
                    </div>
                    <div className="mt-0.5 text-xs text-[#7A6A50]">
                      Last login · {user.loginCount}{" "}
                      {user.loginCount === 1 ? "login" : "logins"}
                    </div>
                    <div className="mt-1 text-xs text-[#A8987A]">
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </td>
                  {tab === "users" && (
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openManage(user)}
                        className={manageButtonClass}
                      >
                        <UserCog size={14} /> Manage access
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Card list: phones, tablets and small laptops */}
      <ul className="grid grid-cols-1 divide-y divide-[#EFE5CE] border-t border-[#E3D6B8] md:grid-cols-2 md:gap-3 md:divide-y-0 md:p-4 min-[1340px]:hidden">
        {rows.map((user) => (
          <li key={user.id} className="min-w-0 px-4 py-4 md:rounded-xl md:border md:border-[#E3D6B8] md:bg-[#FBF6E8]">
            <div className="flex items-start gap-3">
              <Avatar name={user.fullName} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#3B2F1E]">
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
                <div className="mt-1 truncate text-sm text-[#5A4A32]">
                  {user.email || "—"}
                </div>
                <div className="text-xs text-[#7A6A50] tabular-nums">
                  {user.phoneNumber || "No phone"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7A6A50]">
                  <span>
                    {user.subscription
                      ? `Plan: ${user.subscription.planName}`
                      : "No active plan"}
                  </span>
                  <span>Last login {formatDate(user.lastLoginAt, true)}</span>
                </div>
                {user.manualAccess?.isActive && (
                  <div className="mt-2">
                    <StatusPill label="Admin access active" tone="indigo" />
                    <p className="mt-1 text-xs text-[#7A6A50]">
                      Until {formatDate(user.manualAccess.expiresAt)}
                    </p>
                  </div>
                )}
                {tab === "users" && (
                  <button
                    type="button"
                    onClick={() => openManage(user)}
                    className={`mt-3 ${manageButtonClass}`}
                  >
                    <UserCog size={14} /> Manage access
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
      <div className="hidden overflow-x-auto min-[1520px]:block">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="border-y border-[#E3D6B8] bg-[#F2E8D2]">
              <th className={TH}>Customer</th>
              <th className={TH}>Plan</th>
              <th className={`${TH} text-right`}>Amount</th>
              <th className={TH}>Payment</th>
              <th className={TH}>Access</th>
              <th className={TH}>Validity</th>
              <th className={`${TH} min-w-[170px]`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE5CE]">
            {rows.map((item) => {
              const { active, paymentTone, accessTone } =
                subscriptionTones(item);
              const duration = subscriptionDurationLabel(item.planId, item.months, item.planDays);
              const sameAsPlan =
                duration.toLowerCase().replace(/\s/g, "") ===
                (item.planName || "").toLowerCase().replace(/\s/g, "");
              const exp = expiryInfo(item.expiresAt);
              const invoice = item.invoiceId || "";
              const methodDiffers =
                item.paymentMethod &&
                item.paymentMethod.toLowerCase() !==
                  (item.paymentProvider || "").toLowerCase();
              return (
                <tr
                  key={item.id}
                  className="align-top transition-colors hover:bg-[#F6EEDB]"
                >
                  <td className={`px-5 py-4 ${STRIPE[active ? "green" : item.paymentStatus === "COMPLETED" ? "slate" : paymentTone]}`}>
                    <div className="flex items-start gap-3">
                      <Avatar name={item.user?.fullName} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#3B2F1E]">
                          {item.user?.fullName || "Unknown user"}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5A4A32]">
                          <Mail size={12} className="shrink-0 text-[#A8987A]" />
                          <span className="max-w-[200px] truncate">
                            {item.user?.email || "Account unavailable"}
                          </span>
                        </div>
                        {item.user?.phoneNumber && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#7A6A50] tabular-nums">
                            <Phone size={12} className="shrink-0 text-[#A8987A]" />
                            {item.user.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-[#3B2F1E]">
                      {item.planName || item.planId}
                    </div>
                    {!sameAsPlan && (
                      <div className="mt-0.5 text-xs text-[#7A6A50]">{duration}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[15px] font-semibold text-[#3B2F1E] tabular-nums">
                      {money(item.amount)}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-[#7A6A50]">
                      {invoice ? (
                        <>
                          <span className="adm-trx max-w-[110px] truncate" title={invoice}>
                            {invoice}
                          </span>
                          <CopyButton value={invoice} label="invoice ID" />
                        </>
                      ) : (
                        "No invoice"
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={titleCase(item.paymentStatus)}
                      tone={paymentTone}
                    />
                    {(item.paymentProvider || methodDiffers || item.transactionId || item.senderNumber) && (
                      <dl className="mt-2.5 w-[240px] space-y-1.5 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5">
                        {item.paymentProvider && (
                          <DetailRow label="Gateway">{item.paymentProvider}</DetailRow>
                        )}
                        {methodDiffers && (
                          <DetailRow label="Method">{item.paymentMethod}</DetailRow>
                        )}
                        {item.transactionId && (
                          <DetailRow label="TrxID">
                            <span className="adm-trx break-all">{item.transactionId}</span>
                            <CopyButton value={item.transactionId} label="transaction ID" />
                          </DetailRow>
                        )}
                        {item.senderNumber && (
                          <DetailRow label="Sender">
                            <span className="tabular-nums">{item.senderNumber}</span>
                          </DetailRow>
                        )}
                      </dl>
                    )}
                    {item.reviewNote && (
                      <div className="mt-2 w-[240px] rounded-lg border border-[#F3C6C6] bg-[#FEE9E9] px-3 py-2 text-xs leading-5 text-[#B91C1C]">
                        {item.reviewNote}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={active ? "Active" : titleCase(item.accessStatus)}
                      tone={accessTone}
                    />
                  </td>
                  <td className="px-5 py-4">
                    {item.expiresAt ? (
                      <>
                        <div className="text-sm font-semibold text-[#3B2F1E]">
                          {formatDate(item.expiresAt)}
                        </div>
                        {exp.text && (
                          <div className={`mt-0.5 text-xs font-semibold ${EXPIRY_TEXT[exp.tone]}`}>
                            {exp.text}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-[#A8987A]">No access period</div>
                    )}
                    <div className="mt-1 text-xs text-[#7A6A50]">
                      {item.startedAt
                        ? `Started ${formatDate(item.startedAt)}`
                        : "Not activated"}
                    </div>
                  </td>
                  <td className="px-4 py-4">{subscriptionReviewActions(item)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="grid grid-cols-1 divide-y divide-[#EFE5CE] border-t border-[#E3D6B8] md:grid-cols-2 md:gap-3 md:divide-y-0 md:p-4 min-[1520px]:hidden">
        {rows.map((item) => {
          const { active, paymentTone, accessTone } = subscriptionTones(item);
          const exp = expiryInfo(item.expiresAt);
          return (
            <li key={item.id} className="min-w-0 px-4 py-4 md:rounded-xl md:border md:border-[#E3D6B8] md:bg-[#FBF6E8]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={item.user?.fullName} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#3B2F1E]">
                      {item.user?.fullName || "Unknown user"}
                    </div>
                    <div className="truncate text-xs text-[#7A6A50]">
                      {item.user?.email || "Account unavailable"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[#3B2F1E] tabular-nums">
                    {money(item.amount)}
                  </div>
                  <div className="text-xs text-[#7A6A50]">
                    {item.planName || item.planId}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill
                  label={`Payment: ${titleCase(item.paymentStatus)}`}
                  tone={paymentTone}
                />
                <StatusPill
                  label={`Access: ${active ? "Active" : titleCase(item.accessStatus)}`}
                  tone={accessTone}
                />
              </div>
              <div className="mt-2 text-xs text-[#7A6A50]">
                {item.expiresAt ? (
                  <>
                    Expires {formatDate(item.expiresAt)}
                    {exp.text && (
                      <span className={`ml-1 font-semibold ${EXPIRY_TEXT[exp.tone]}`}>
                        · {exp.text}
                      </span>
                    )}
                  </>
                ) : (
                  "No access period"
                )}
                {item.startedAt ? ` · Started ${formatDate(item.startedAt)}` : ""}
              </div>
              {(item.paymentProvider || item.paymentMethod || item.transactionId || item.senderNumber) && (
                <dl className="mt-2.5 space-y-1.5 rounded-lg border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5">
                  {item.paymentProvider && <DetailRow label="Gateway">{item.paymentProvider}</DetailRow>}
                  {item.paymentMethod && <DetailRow label="Method">{item.paymentMethod}</DetailRow>}
                  {item.transactionId && (
                    <DetailRow label="TrxID">
                      <span className="adm-trx break-all">{item.transactionId}</span>
                      <CopyButton value={item.transactionId} label="transaction ID" />
                    </DetailRow>
                  )}
                  {item.senderNumber && <DetailRow label="Sender">{item.senderNumber}</DetailRow>}
                </dl>
              )}
              {item.reviewNote && (
                <div className="mt-2 rounded-lg border border-[#F3C6C6] bg-[#FEE9E9] px-3 py-2 text-xs text-[#B91C1C]">
                  {item.reviewNote}
                </div>
              )}
              <div className="mt-3">{subscriptionReviewActions(item)}</div>
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
    <div className="space-y-3 px-5 py-4 sm:px-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          opts.apply();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A8987A]"
          />
          <input
            value={opts.value}
            onChange={(e) => opts.setValue(e.target.value)}
            placeholder={opts.placeholder}
            aria-label={opts.placeholder}
            className={`${INPUT} w-full pl-9 pr-3`}
          />
        </div>
        <button
          type="submit"
          className={`h-10 rounded-lg bg-[#DC2626] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#B91C1C] active:scale-[0.98] ${FOCUS}`}
        >
          {opts.label}
        </button>
      </form>
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-1.5"
      >
        {opts.options.map(([v, l]) => {
          const on = opts.status === v;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => opts.setStatus(v)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${FOCUS} ${on ? "border-[#3B2F1E] bg-[#3B2F1E] text-[#FBF6E8] shadow-sm" : "border-[#D8C9A6] bg-[#FFFDF6] text-[#5A4A32] hover:border-[#3B2F1E] hover:text-[#3B2F1E]"}`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );

  const growthDetail =
    stats?.weeklyGrowthPercent == null
      ? `Last 7 days: ${(stats?.weeklyRegistrations || 0).toLocaleString("en-BD")}`
      : `Last 7 days: ${(stats?.weeklyRegistrations || 0).toLocaleString("en-BD")} (${stats.weeklyGrowthPercent >= 0 ? "+" : ""}${stats.weeklyGrowthPercent}% vs previous week)`;

  const metricGroups: {
    title: string;
    cards: {
      title: string;
      value: string;
      detail: string;
      icon: typeof Users;
      tint: string;
    }[];
  }[] = [
    {
      title: "Account details",
      cards: [
        { title: "Logged in today", value: num(stats?.loginsToday), detail: "Bangladesh time", icon: LogIn, tint: "bg-[#FDF1D0] text-[#8A5A00]" },
        { title: "Never logged in", value: num(stats?.neverLoggedIn), detail: "Registered but no login recorded", icon: UserX, tint: "bg-[#F2E8D2] text-[#5A4A32]" },
        { title: "Banned accounts", value: num(stats?.bannedUsers), detail: "Currently blocked from the platform", icon: Ban, tint: "bg-[#FEE9E9] text-[#B91C1C]" },
        {
          title: "Top district",
          value: overviewLoading ? "—" : stats?.topDistrict?.name || "—",
          detail: stats?.topDistrict ? `${stats.topDistrict.users.toLocaleString("en-BD")} registered users` : "No location data yet",
          icon: MapPin,
          tint: "bg-[#FDF1D0] text-[#8A5A00]",
        },
      ],
    },
  ];

  const mainCards = [
    {
      title: "Total registered users",
      value: num(stats?.totalUsers),
      detail: `${num(stats?.newToday)} new today`,
      icon: Users,
      tint: "bg-[#F2E8D2] text-[#5A4A32]",
    },
    {
      title: "Total subscriptions",
      value: num(stats?.totalSubscriptions),
      detail: `${num(stats?.activeSubscriptions)} active now`,
      icon: ReceiptText,
      tint: "bg-[#FEE9E9] text-[#B91C1C]",
    },
    {
      title: "Total revenue",
      value: overviewLoading ? "—" : money(stats?.totalRevenue),
      detail: "All time, completed payments",
      icon: CircleDollarSign,
      tint: "bg-[#FDF1D0] text-[#8A5A00]",
    },
    {
      title: "Online now",
      value: num(stats?.activeNow),
      detail: "Active on the site in the last 3 minutes",
      icon: Activity,
      tint: "bg-emerald-50 text-emerald-700",
    },
  ];

  const summaryRows = [
    {
      icon: CircleDollarSign,
      tint: "bg-[#FEE9E9] text-[#B91C1C]",
      label: "Recorded revenue",
      detail: "Total of recorded subscription amounts",
      value: overviewLoading ? "—" : money(stats?.totalRevenue),
    },
    {
      icon: BadgeCheck,
      tint: "bg-emerald-50 text-emerald-700",
      label: "Active subscribers",
      detail: `${(stats?.activeSubscriptions || 0).toLocaleString("en-BD")} active subscription records`,
      value: num(stats?.activeSubscribers),
    },
    {
      icon: Clock3,
      tint: "bg-[#FDF1D0] text-[#8A5A00]",
      label: "Pending payments",
      detail: "Awaiting payment confirmation",
      value: num(stats?.pendingPayments),
    },
  ];

  return (
    <main className="admin-theme min-h-dvh overflow-x-clip bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E] antialiased">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-[#2A2118]/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`adm-sidebar fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-gradient-to-b from-[#3B2F1E] to-[#2A2118] text-[#FBF6E8] transition-transform duration-200 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DC2626] text-white shadow-[0_6px_14px_-6px_rgba(220,38,38,0.9)]">
            <ShieldCheck size={19} strokeWidth={1.9} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-semibold tracking-tight text-white">
              {siteSettings.branding.siteName || "Website"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#F2B93B]">
              <span aria-hidden="true" className="h-[2px] w-3 bg-[#F2B93B]" />
              Admin workspace
            </div>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className={`ml-auto rounded-lg p-1.5 text-[#E3D6B8] hover:bg-white/10 lg:hidden ${FOCUS}`}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 pt-5"
          aria-label="Admin navigation"
        >
          <div className="px-3 pb-2 text-xs font-medium text-[#E3D6B8]/60">
            Workspace
          </div>
          <div className="space-y-1">
            {navItems.map(({ key, label, icon: Icon, badgeCount }) => {
              const on = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => selectTab(key)}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${FOCUS} focus-visible:ring-offset-[#2A2118] ${on ? "bg-[#FBF6E8]/12 text-white" : "text-[#E3D6B8] hover:bg-white/8 hover:text-white"}`}
                >
                  {on && (
                    <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#F2B93B]" />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={on ? "text-[#F2B93B]" : "text-[#E3D6B8]/60"}
                  />
                  <span className="min-w-0 flex-1">{label}</span>
                  {badgeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC2626] px-1.5 text-[10px] font-bold text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-[#E3D6B8]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Online now
            </span>
            <span className="font-semibold text-white tabular-nums">
              {activeCount}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2.5">
            <Avatar name={displayName} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">
                {displayName}
              </div>
              <div className="truncate text-xs text-[#E3D6B8]/70">
                {admin?.email || "Administrator"}
              </div>
            </div>
            <button
              onClick={() => void logOut()}
              className={`rounded-lg p-2 text-[#E3D6B8]/70 transition hover:bg-[#DC2626]/20 hover:text-white focus-visible:ring-offset-[#2A2118] ${FOCUS}`}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen min-w-0 lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E3D6B8] bg-[#FBF6E8]/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className={`rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] p-2 text-[#5A4A32] hover:bg-[#F2E8D2] lg:hidden ${FOCUS}`}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-xs text-[#7A6A50]">
                Administration / {navItems.find((i) => i.key === tab)?.label}
              </div>
              <h1 className="truncate text-base font-semibold tracking-tight text-[#3B2F1E]">
                {pageTitle}
              </h1>
            </div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[240px] truncate rounded-full border border-[#E3D6B8] bg-[#F2E8D2] px-3 py-1.5 text-xs font-medium text-[#5A4A32] lg:inline">
              {admin?.email}
            </span>
            <button
              onClick={() => void refreshCurrent()}
              disabled={refreshing}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8C9A6] bg-[#FFFDF6] px-3 text-sm font-semibold text-[#5A4A32] shadow-sm transition hover:border-[#3B2F1E] hover:text-[#3B2F1E] disabled:opacity-60 ${FOCUS}`}
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
              className="mb-5 flex items-start gap-3 rounded-xl border border-[#F3C6C6] bg-[#FEE9E9] px-4 py-3 text-sm text-[#B91C1C]"
            >
              <Activity size={17} className="mt-0.5 shrink-0" />
              <div className="flex-1">{globalError}</div>
              <button
                onClick={() => void loadOverview()}
                className="cursor-pointer text-sm font-semibold underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-6">
              <section aria-label="Main numbers">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {mainCards.map((card, index) => (
                    <article
                      key={card.title}
                      className={`${CARD} p-5 sm:p-6`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B2F1E] text-xs font-bold text-[#FBF6E8]">
                            {index + 1}
                          </span>
                          <p className="truncate text-sm font-semibold text-[#5A4A32]">
                            {card.title}
                          </p>
                        </div>
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.tint}`}
                        >
                          <card.icon size={21} strokeWidth={1.8} />
                        </span>
                      </div>
                      <p className="mt-4 text-[34px] font-bold leading-none tracking-tight text-[#3B2F1E] tabular-nums">
                        {card.value}
                      </p>
                      <p className="mt-4 border-t border-[#EFE5CE] pt-3 text-xs text-[#7A6A50]">
                        {card.detail}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section
                aria-label="Welcome"
                className="relative overflow-hidden rounded-2xl border border-[#5A4A32] bg-[#3B2F1E] text-white shadow-[0_14px_36px_-16px_rgba(59,47,30,0.65)]"
              >
                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_1fr]">
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-[2px] w-8 bg-[#F2B93B]" />
                      <span className="text-sm font-medium text-[#F2B93B]">
                        Admin overview
                      </span>
                    </div>
                    <h2 className="mt-4 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
                      Welcome back, {displayName.split(" ")[0]}
                    </h2>
                    <p className="mt-2 max-w-md text-[15px] leading-6 text-[#E3D6B8]">
                      Payments, subscriptions and users — everything you need to
                      check, in one place.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          setSubscriptionStatus("pending");
                          selectTab("subscriptions");
                        }}
                        className={`inline-flex items-center gap-2 rounded-md bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] active:scale-[0.98] focus-visible:ring-offset-[#3B2F1E] ${FOCUS}`}
                      >
                        View pending payments
                        <ChevronRight size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSubscriptionStatus("all");
                          selectTab("subscriptions");
                        }}
                        className={`inline-flex items-center rounded-md border border-[#FBF6E8]/35 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#FBF6E8]/10 focus-visible:ring-offset-[#3B2F1E] ${FOCUS}`}
                      >
                        All subscriptions
                      </button>
                    </div>
                    {overview?.generatedAt && (
                      <p className="mt-5 flex items-center gap-1.5 text-xs text-[#E3D6B8]/70">
                        <Clock3 size={13} />
                        Updated {formatDate(overview.generatedAt, true)}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#FBF6E8] p-5 text-[#3B2F1E] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[15px] font-semibold">
                        Subscription summary
                      </h3>
                      <span className="rounded-md bg-[#F2B93B] px-1.5 py-[2px] text-[11px] font-bold leading-none text-[#3B2F1E]">
                        All time
                      </span>
                    </div>
                    <dl className="mt-2 divide-y divide-[#E3D6B8]">
                      {summaryRows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center gap-3 py-3.5"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.tint}`}
                          >
                            <row.icon size={19} strokeWidth={1.8} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <dt className="text-sm font-semibold">{row.label}</dt>
                            <dd className="mt-0.5 text-xs text-[#7A6A50]">
                              {row.detail}
                            </dd>
                          </div>
                          <span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </section>

              <OverviewInsights
                stats={stats}
                insights={overview?.insights}
                loading={overviewLoading}
                onNavigate={(target) => {
                  if (target === "pending") { setSubscriptionStatus("pending"); selectTab("subscriptions"); }
                  else if (target === "failed" || target === "expiring") { setSubscriptionStatus("all"); selectTab("subscriptions"); }
                  else if (target === "chats") selectTab("chats");
                  else selectTab("generations");
                }}
              />

              {metricGroups.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#7A6A50]">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {group.cards.map((card) => (
                      <StatCard key={card.title} {...card} />
                    ))}
                  </div>
                </section>
              ))}

              <section className="grid grid-cols-1 gap-4">
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
                                  className={`w-full max-w-[36px] rounded-t-md transition-colors ${FOCUS} ${hoverBar === i ? "bg-[#DC2626]" : "bg-[#5A4A32]"}`}
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

              </section>
            </div>
          )}

          {tab === "users" && (
            <section className={`${CARD} overflow-hidden`}>
              <div className="p-5 pb-0 sm:px-6 sm:pt-6">
                <PanelHeading
                  title="All users"
                  description="A user shows as online while active on the site (click, touch, typing or scrolling). They go offline after about 3 minutes without any activity."
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
          {tab === "generations" && <AdminGenerationPanel />}
          {tab === "settings" && <SiteSettingsPanel />}
          {tab === "payment-gateway" && <div className="space-y-6"><PaymentGatewaySettingsPanel /><UddoktaPaySettingsPanel /></div>}
          {tab === "smtp" && <div className="space-y-6"><SmtpSettingsPanel /><MailCampaignPanel /></div>}
          {tab === "subscription-plans" && <SubscriptionPlansPanel key={subscriptionPlansRefreshKey} />}
          {tab === "subscription-activity" && <SubscriptionActivityPanel />}
          {tab === "bot-status" && <BotStatusPanel />}

          {accessModalUser && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A2118]/60 px-4 py-6 backdrop-blur-sm"
              onClick={() => {
                if (!accessSaving && !userDeleting && !userActionBusy) setAccessModalUser(null);
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="manual-access-title"
                className="relative max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-5 shadow-2xl sm:p-6"
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

                    <button
                      type="button"
                      disabled={userActionBusy || userDeleting || confirmingUserDelete || accessModalUser.isPrimaryAdmin === true || accessModalUser.id === admin?.id || (accessModalUser.role === "admin" && !admin?.isRootAdmin)}
                      onClick={() => void loginAsUser()}
                      title="Opens this account's own session. Stays open while you're active, up to a 12-hour hard limit. Does not change or reveal their password. Logged for audit."
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LogIn size={15} /> Login as this user
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
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    "Login as this user" opens their account as they see it, without touching their password. It stays open while you're actively using it and ends automatically if left idle or after 12 hours. Every session is recorded (admin, account, start/end time) for audit.
                  </p>

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
            <span>© {new Date().getFullYear()} Seba Lagbe</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} /> Admin access is verified on the server
            </span>
          </footer>
        </div>
      </div>
    </main>
  );
}
