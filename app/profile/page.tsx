"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import BusinessInfoTab, {
  type BusinessFormData,
} from "./components/BusinessInfoTab";
import ChangePasswordTab, {
  type PasswordFormData,
} from "./components/ChangePasswordTab";
import CreditAlert from "./components/CreditAlert";
import DevicesLoginTab from "./components/DevicesLoginTab";
import PersonalInfoTab, {
  type ProfileFormData,
} from "./components/PersonalInfoTab";
import ProfileHeader from "./components/ProfileHeader";
import ProfileProgress from "./components/ProfileProgress";
import ProfileTabs, { type Tab } from "./components/ProfileTabs";

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
  credits?: number;
  profileCompletionPercentage?: number;
  isEmailVerified?: boolean;
  businessName?: string;
  businessType?: string;
  tradeLicense?: string;
  businessPhone?: string;
  businessAddress?: string;
  website?: string;
}

interface BusinessInfo {
  businessName?: string;
  businessType?: string;
  tradeLicense?: string;
  businessPhone?: string;
  businessAddress?: string;
  website?: string;
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

type ToastType = "success" | "error" | "info";

type ToastState = {
  type: ToastType;
  message: string;
} | null;

type ApiResponse = {
  user?: UserProfile;
  business?: BusinessInfo;
  devices?: DeviceSession[];
  message?: string;
  error?: string;
};

const API = {
  me: "/api/auth/me",
  updateProfile: "/api/user/update",
  sendVerification: "/api/auth/send-verification",
  business: "/api/user/business",
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

const emptyBusinessForm: BusinessFormData = {
  businessName: "",
  businessType: "",
  tradeLicense: "",
  businessPhone: "",
  businessAddress: "",
  website: "",
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

  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    return (await response.json()) as ApiResponse;
  } catch {
    return {};
  }
}

export default function ProfilePage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessInfo>({});
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Personal Information");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileForm, setProfileForm] =
    useState<ProfileFormData>(emptyProfileForm);
  const [savingProfile, setSavingProfile] = useState(false);

  const [businessForm, setBusinessForm] =
    useState<BusinessFormData>(emptyBusinessForm);
  const [savingBusiness, setSavingBusiness] = useState(false);

  const [passwordForm, setPasswordForm] =
    useState<PasswordFormData>(emptyPasswordForm);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const getToken = useCallback(() => {
    return typeof window !== "undefined" ? localStorage.getItem("token") : null;
  }, []);

  const syncBusinessData = useCallback(
    (nextUser: UserProfile, explicitBusiness?: BusinessInfo) => {
      const extractedBusiness: BusinessInfo = explicitBusiness || {
        businessName: nextUser?.businessName || "",
        businessType: nextUser?.businessType || "",
        tradeLicense: nextUser?.tradeLicense || "",
        businessPhone: nextUser?.businessPhone || "",
        businessAddress: nextUser?.businessAddress || "",
        website: nextUser?.website || "",
      };

      setBusiness(extractedBusiness);
      setBusinessForm({
        ...emptyBusinessForm,
        ...extractedBusiness,
      });
    },
    [],
  );

  const persistUser = useCallback(
    (nextUser: UserProfile, explicitBusiness?: BusinessInfo) => {
      setUser(nextUser);
      syncBusinessData(nextUser, explicitBusiness);

      try {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } catch {
        // Ignore storage errors.
      }
    },
    [syncBusinessData],
  );

  const fetchProfile = useCallback(
    async (showLoader = true) => {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      try {
        const response = await fetch(API.me, {
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
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.user) {
          throw new Error(
            getApiError(data, "Unable to load your profile right now."),
          );
        }

        persistUser(data.user, data.business);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your profile.";

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, persistUser, router],
  );

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setIsAuthenticated(true);

    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as UserProfile;
        persistUser(parsedUser);
      }
    } catch {
      localStorage.removeItem("user");
    }

    void fetchProfile();
  }, [fetchProfile, getToken, persistUser, router]);

  const loadDevices = useCallback(async () => {
    const token = getToken();

    if (!token) return;

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

      if (!response.ok) {
        throw new Error(getApiError(data, "Unable to load login devices."));
      }

      setDevices(Array.isArray(data.devices) ? data.devices : []);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Unable to load login devices.",
      );
    } finally {
      setLoadingDevices(false);
    }
  }, [getToken, router, showToast]);

  useEffect(() => {
    if (activeTab === "Devices login") {
      void loadDevices();
    }
  }, [activeTab, loadDevices]);

  const openEditModal = useCallback(() => {
    setProfileForm({
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      country: user?.country || "",
      profession: user?.profession || "",
      gender: user?.gender || "",
      dob: user?.dob ? user.dob.slice(0, 10) : "",
      address: user?.address || "",
      district: user?.district || "",
      thana: user?.thana || "",
      postcode: user?.postcode || "",
      about: user?.about || "",
    });

    setIsEditOpen(true);
  }, [user]);

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!profileForm.fullName.trim()) {
      showToast("error", "Full name is required.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch(API.updateProfile, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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

      if (!response.ok) {
        throw new Error(getApiError(data, "Unable to update your profile."));
      }

      const nextUser: UserProfile = {
        ...(user || {}),
        ...profileForm,
        ...(data.user || {}),
      };

      persistUser(nextUser, business);

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

      setIsEditOpen(false);

      showToast("success", data.message || "Profile updated successfully.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Unable to update your profile.",
      );
    } finally {
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
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const data = await safeJson(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Unable to send verification email."),
        );
      }

      showToast(
        "success",
        data.message || "Verification email sent. Please check your inbox.",
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to send verification email.",
      );
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleBusinessSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSavingBusiness(true);

    try {
      const response = await fetch(API.business, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(businessForm),
      });

      const data = await safeJson(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiError(data, "Unable to update business information."),
        );
      }

      const updatedBusiness = data.business || businessForm;
      const updatedUser: UserProfile = {
        ...(user || {}),
        ...updatedBusiness,
        ...(data.user || {}),
      };

      persistUser(updatedUser, updatedBusiness);

      showToast(
        "success",
        data.message || "Business information updated successfully.",
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to update business information.",
      );
    } finally {
      setSavingBusiness(false);
    }
  };

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("error", "Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      showToast("error", "New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "New password and confirmation do not match.");
      return;
    }

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch(API.changePassword, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await safeJson(response);

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(getApiError(data, "Unable to change your password."));
      }

      setPasswordForm(emptyPasswordForm);

      showToast("success", data.message || "Password changed successfully.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Unable to change your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const credits = Math.max(0, Number(user?.credits ?? 0));

  const profileCompletionFields = useMemo(
    () => [
      user?.fullName,
      user?.phoneNumber,
      user?.email,
      user?.country,
      user?.district,
      user?.profession,
      user?.gender,
      user?.dob,
      user?.address,
      user?.thana,
      user?.postcode,
      user?.about,
    ],
    [user],
  );

  const profileCompletion = useMemo(() => {
    const totalFields = profileCompletionFields.length;

    const filledFields = profileCompletionFields.filter(
      (value) => typeof value === "string" && value.trim().length > 0,
    ).length;

    if (totalFields === 0) return 0;

    return Math.min(100, Math.round((filledFields / totalFields) * 100));
  }, [profileCompletionFields]);

  const isEmailVerified = Boolean(user?.isEmailVerified);

  const isLowCredit = credits <= 5;

  const missingPercentage = useMemo(
    () => Math.max(0, Math.round(100 - profileCompletion)),
    [profileCompletion],
  );

  if (isAuthenticated === null || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 size={16} className="animate-spin text-[#2563EB]" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans pb-12">
      <DashboardNavbar />

      <main className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>

            <p className="text-xs text-gray-400 font-medium">
              Manage your personal and business information
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchProfile(false)}
            disabled={refreshing}
            className="bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />

            <div className="text-xs">
              <p className="font-bold text-red-700">
                Could not refresh profile
              </p>

              <p className="text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <ProfileHeader user={user} credits={credits} />

        {isLowCredit && (
          <CreditAlert
            credits={credits}
            onBuyCredit={() => router.push("/dashboard/buy-credit")}
          />
        )}

        <ProfileProgress
          profileCompletion={profileCompletion}
          missingPercentage={missingPercentage}
        />

        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "Personal Information" && (
          <PersonalInfoTab
            user={user}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            isEditOpen={isEditOpen}
            setIsEditOpen={setIsEditOpen}
            onEdit={openEditModal}
            onSubmit={handleProfileSave}
            savingProfile={savingProfile}
            isEmailVerified={isEmailVerified}
            verifyingEmail={verifyingEmail}
            onSendVerification={handleSendVerification}
          />
        )}

        {activeTab === "Shop / Business Information" && (
          <BusinessInfoTab
            business={business}
            businessForm={businessForm}
            setBusinessForm={setBusinessForm}
            savingBusiness={savingBusiness}
            onSubmit={handleBusinessSave}
          />
        )}

        {activeTab === "Change Password" && (
          <ChangePasswordTab
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            savingPassword={savingPassword}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            onSubmit={handlePasswordSave}
          />
        )}

        {activeTab === "Devices login" && (
          <DevicesLoginTab
            devices={devices}
            loadingDevices={loadingDevices}
            onRefresh={() => void loadDevices()}
          />
        )}
      </main>

      {toast && (
        <div className="fixed right-4 bottom-4 z-[60] max-w-sm">
          <div
            className={`rounded-xl border px-4 py-3 shadow-lg flex items-start gap-2.5 bg-white ${
              toast.type === "success"
                ? "border-emerald-100"
                : toast.type === "error"
                  ? "border-red-100"
                  : "border-gray-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle size={17} className="text-red-500 shrink-0" />
            ) : (
              <Mail size={17} className="text-blue-500 shrink-0" />
            )}

            <p
              className={`text-xs font-semibold ${
                toast.type === "success"
                  ? "text-emerald-700"
                  : toast.type === "error"
                    ? "text-red-700"
                    : "text-gray-700"
              }`}
            >
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
