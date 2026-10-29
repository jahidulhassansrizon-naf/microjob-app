"use client";
import { T, useSettingsText } from "./components/settingsI18n";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, LockKeyhole, MonitorSmartphone, RefreshCw, UserRound } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import PersonalInfoTab, { type ProfileFormData } from "./components/PersonalInfoTab";
import ChangePasswordTab, { type PasswordFormData } from "./components/ChangePasswordTab";
import DevicesLoginTab from "./components/DevicesLoginTab";
interface UserProfile {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    country?: string;
    district?: string;
    profession?: string;
    gender?: string;
    dob?: string;
    address?: string;
    thana?: string;
    postcode?: string;
    about?: string;
    isEmailVerified?: boolean;
    role?: "user" | "admin";
    isRootAdmin?: boolean;
    isPrimaryAdmin?: boolean;
}
interface DeviceSession {
    id: string;
    deviceName?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    lastActive?: string;
    current?: boolean;
}
type ApiResponse = {
    user?: UserProfile;
    devices?: DeviceSession[];
    message?: string;
    error?: string;
};
type SettingSection = "Personal Information" | "Change Password" | "Devices Login";
type ToastType = "success" | "error";
type ToastState = {
    type: ToastType;
    message: string;
} | null;
const API = {
    me: "/api/auth/me",
    updateProfile: "/api/user/update",
    sendVerification: "/api/auth/send-verification",
    changePassword: "/api/auth/change-password",
    devices: "/api/user/devices",
};
const emptyProfileForm: ProfileFormData = {
    fullName: "",
    phoneNumber: "",
    country: "",
    profession: "",
    gender: "",
    dob: "",
    address: "",
    district: "",
    thana: "",
    postcode: "",
    about: "",
};
const emptyPasswordForm: PasswordFormData = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};
function getApiError(data: ApiResponse, fallback: string) {
    return data?.error || data?.message || fallback;
}
async function safeJson(response: Response): Promise<ApiResponse> {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json"))
        return {};
    try {
        return (await response.json()) as ApiResponse;
    }
    catch {
        return {};
    }
}
export default function SettingsPage() {
    const router = useRouter();
    const { t } = useSettingsText();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activeSection, setActiveSection] = useState<SettingSection>("Personal Information");
    const [profileForm, setProfileForm] = useState<ProfileFormData>(emptyProfileForm);
    const [passwordForm, setPasswordForm] = useState<PasswordFormData>(emptyPasswordForm);
    const [devices, setDevices] = useState<DeviceSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ type, message });
    }, []);
    useEffect(() => {
        if (!toast)
            return;
        const timer = window.setTimeout(() => setToast(null), 4000);
        return () => window.clearTimeout(timer);
    }, [toast]);
    const getToken = useCallback(() => {
        return typeof window !== "undefined" ? localStorage.getItem("token") : null;
    }, []);
    const syncUser = useCallback((nextUser: UserProfile) => {
        setUser(nextUser);
        setProfileForm({
            fullName: nextUser.fullName || "",
            phoneNumber: nextUser.phoneNumber || "",
            country: nextUser.country || "",
            profession: nextUser.profession || "",
            gender: nextUser.gender || "",
            dob: nextUser.dob ? nextUser.dob.slice(0, 10) : "",
            address: nextUser.address || "",
            district: nextUser.district || "",
            thana: nextUser.thana || "",
            postcode: nextUser.postcode || "",
            about: nextUser.about || "",
        });
        try {
            localStorage.setItem("user", JSON.stringify(nextUser));
        }
        catch {
            // Ignore storage errors.
        }
    }, []);
    const fetchProfile = useCallback(async (showLoader = true) => {
        const token = getToken();
        if (showLoader)
            setLoading(true);
        else
            setRefreshing(true);
        try {
            const response = await fetch(API.me, {
                method: "GET",
                credentials: "include",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });
            const data = await safeJson(response);
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }
            if (!response.ok || !data.user) {
                throw new Error(getApiError(data, "Unable to load your settings."));
            }
            syncUser(data.user);
        }
        catch (err) {
            showToast("error", err instanceof Error ? err.message : "Unable to load your settings.");
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken, router, showToast, syncUser]);
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser)
                syncUser(JSON.parse(storedUser) as UserProfile);
        }
        catch {
            localStorage.removeItem("user");
        }
        void fetchProfile();
    }, [fetchProfile, syncUser]);
    const loadDevices = useCallback(async () => {
        const token = getToken();
        if (!token)
            return;
        setLoadingDevices(true);
        try {
            const response = await fetch(API.devices, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });
            const data = await safeJson(response);
            if (response.status === 401) {
                localStorage.removeItem("token");
                router.replace("/login");
                return;
            }
            if (!response.ok)
                throw new Error(getApiError(data, "Unable to load login devices."));
            setDevices(Array.isArray(data.devices) ? data.devices : []);
        }
        catch (err) {
            showToast("error", err instanceof Error ? err.message : "Unable to load login devices.");
        }
        finally {
            setLoadingDevices(false);
        }
    }, [getToken, router, showToast]);
    useEffect(() => {
        if (activeSection !== "Devices Login")
            return;
        void loadDevices();
    }, [activeSection, loadDevices]);
    const openEditModal = useCallback(() => {
        setIsEditOpen(true);
    }, []);
    const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const token = getToken();
        if (!profileForm.fullName.trim()) {
            showToast("error", "Full name is required.");
            return;
        }
        setSavingProfile(true);
        try {
            const response = await fetch(API.updateProfile, {
                method: "PUT",
                credentials: "include",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: profileForm.fullName.trim(),
                    phoneNumber: profileForm.phoneNumber.trim(),
                    country: profileForm.country.trim(),
                    district: profileForm.district.trim(),
                    profession: profileForm.profession.trim(),
                    gender: profileForm.gender.trim(),
                    dob: profileForm.dob.trim(),
                    address: profileForm.address.trim(),
                    thana: profileForm.thana.trim(),
                    postcode: profileForm.postcode.trim(),
                    about: profileForm.about.trim(),
                }),
            });
            const data = await safeJson(response);
            if (response.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/login");
                return;
            }
            if (!response.ok)
                throw new Error(getApiError(data, "Unable to update your personal information."));
            syncUser({ ...(user || {}), ...profileForm, ...(data.user || {}) });
            setIsEditOpen(false);
            showToast("success", data.message || "Personal information updated successfully.");
        }
        catch (err) {
            showToast("error", err instanceof Error ? err.message : "Unable to update your personal information.");
        }
        finally {
            setSavingProfile(false);
        }
    };
    const handleSendVerification = async () => {
        if (!user?.email) {
            showToast("error", "No email address is available for verification.");
            return;
        }
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }
        setVerifyingEmail(true);
        try {
            const response = await fetch(API.sendVerification, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: user.email }),
            });
            const data = await safeJson(response);
            if (response.status === 401) {
                localStorage.removeItem("token");
                router.replace("/login");
                return;
            }
            if (!response.ok)
                throw new Error(getApiError(data, "Unable to send verification email."));
            showToast("success", data.message || "Verification email sent. Please check your inbox.");
        }
        catch (err) {
            showToast("error", err instanceof Error ? err.message : "Unable to send verification email.");
        }
        finally {
            setVerifyingEmail(false);
        }
    };
    const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = passwordForm;
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("error", "Please complete all password fields.");
            return;
        }
        const minimumPasswordLength = user?.isRootAdmin ? 12 : 8;
        if (newPassword.length < minimumPasswordLength) {
            showToast("error", `New password must be at least ${minimumPasswordLength} characters long.`);
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("error", "New password and confirmation do not match.");
            return;
        }
        const token = getToken();
        setSavingPassword(true);
        try {
            const response = await fetch(API.changePassword, {
                method: "PUT",
                credentials: "include",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await safeJson(response);
            if (response.status === 401) {
                localStorage.removeItem("token");
                router.replace("/login");
                return;
            }
            if (!response.ok)
                throw new Error(getApiError(data, "Unable to change your password."));
            setPasswordForm(emptyPasswordForm);
            try {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.dispatchEvent(new Event("sohojhub:auth-changed"));
            } catch {
                // Session cleanup must not expose or restore the previous token.
            }
            showToast("success", data.message || "Password changed successfully. Please sign in again.");
            window.setTimeout(() => router.replace("/login"), 900);
        }
        catch (err) {
            showToast("error", err instanceof Error ? err.message : "Unable to change your password.");
        }
        finally {
            setSavingPassword(false);
        }
    };
    if (loading && !user) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#F6EEDB]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#5A4A32] bg-[#FBF6E8] px-5 py-3 rounded-2xl border border-[#E3D6B8] shadow-xs">
          <RefreshCw size={16} className="animate-spin text-[#DC2626]"/><T>{"Loading settings...\n        "}</T></div>
      </div>);
    }
    const sectionMeta = {
        "Personal Information": {
            icon: UserRound,
            description: "Update the personal details linked to your account.",
        },
        "Change Password": {
            icon: LockKeyhole,
            description: "Change your account password and keep your login secure.",
        },
        "Devices Login": {
            icon: MonitorSmartphone,
            description: "Review the devices and sessions currently associated with your account.",
        },
    } satisfies Record<SettingSection, {
        icon: typeof UserRound;
        description: string;
    }>;
    const ActiveIcon = sectionMeta[activeSection].icon;
    return (<div className="page-font min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] text-[#3B2F1E] font-sans pb-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
      `}</style>
      <DashboardNavbar />

      <main className="max-w-[1120px] mx-auto px-4 py-7 sm:py-9">
        <div className="mb-6">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#DC2626]"><T>{"Account"}</T></p>
          <h1 className="mt-1 text-3xl sm:text-3xl font-bold text-[#3B2F1E]"><T>{"Settings"}</T></h1>
          <p className="mt-1 text-base text-[#6B5A40]"><T>{"Manage your personal information, password, and logged-in devices."}</T></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5">
          <aside className="h-fit rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-2.5 shadow-sm">
            {(["Personal Information", "Change Password", "Devices Login"] as SettingSection[]).map((item) => {
            const Icon = sectionMeta[item].icon;
            const active = activeSection === item;
            return (<button key={item} type="button" onClick={() => setActiveSection(item)} className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${active ? "bg-[#F6D9A8] text-[#3B2F1E] ring-2 ring-[#DC2626]/40" : "text-[#5A4A32] hover:bg-[#EFE3C8]"}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-[#FBF6E8] text-[#DC2626] ring-1 ring-inset ring-[#DC2626]/20" : "bg-[#F3E9D2] text-[#6B5A40]"}`}>
                    <Icon size={17}/>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold truncate"><T>{item}</T></span>
                    <span className="mt-0.5 block text-[12px] text-[#7A6A50]">{item === "Devices Login" ? t("Sessions") : item === "Change Password" ? t("Security") : t("Account details")}</span>
                  </span>
                </button>);
        })}
          </aside>

          <section className="min-w-0 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 sm:p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-[#E3D6B8] pb-4 mb-5">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEE9E9] text-[#DC2626] ring-1 ring-inset ring-[#DC2626]/20">
                  <ActiveIcon size={18}/>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#3B2F1E]"><T>{activeSection}</T></h2>
                  <p className="mt-0.5 text-sm text-[#6B5A40]"><T>{sectionMeta[activeSection].description}</T></p>
                </div>
              </div>
              <button type="button" onClick={() => void fetchProfile(false)} disabled={refreshing} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2 text-sm font-semibold text-[#5A4A32] hover:bg-[#F6EEDB] disabled:opacity-60">
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""}/><T>{"Refresh\n              "}</T></button>
            </div>

            {activeSection === "Personal Information" && (<PersonalInfoTab user={user} profileForm={profileForm} setProfileForm={setProfileForm} isEditOpen={isEditOpen} setIsEditOpen={setIsEditOpen} onEdit={openEditModal} onSubmit={handleProfileSave} savingProfile={savingProfile} isEmailVerified={Boolean(user?.isEmailVerified)} verifyingEmail={verifyingEmail} onSendVerification={handleSendVerification}/>)}

            {activeSection === "Change Password" && (<ChangePasswordTab passwordForm={passwordForm} setPasswordForm={setPasswordForm} savingPassword={savingPassword} showCurrentPassword={showCurrentPassword} showNewPassword={showNewPassword} showConfirmPassword={showConfirmPassword} setShowCurrentPassword={setShowCurrentPassword} setShowNewPassword={setShowNewPassword} setShowConfirmPassword={setShowConfirmPassword} onSubmit={handlePasswordSave}/>)}

            {activeSection === "Devices Login" && (<DevicesLoginTab devices={devices} loadingDevices={loadingDevices} onRefresh={() => void loadDevices()}/>)}
          </section>
        </div>
      </main>

      {toast && (<div className="fixed right-4 bottom-4 z-[60] max-w-sm">
          <div className={`rounded-xl border px-4 py-3 shadow-lg flex items-start gap-2.5 bg-[#FBF6E8] ${toast.type === "success" ? "border-emerald-100" : "border-[#FBB6B6]"}`}>
            {toast.type === "success" ? (<CheckCircle2 size={17} className="text-emerald-500 shrink-0"/>) : (<AlertCircle size={17} className="text-red-500 shrink-0"/>)}
            <p className={`text-sm font-semibold ${toast.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
              {t(toast.message)}
            </p>
          </div>
        </div>)}
    </div>);
}
