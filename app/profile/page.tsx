"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import ProfileHeader from "./components/ProfileHeader";
import SubscriptionCard from "./components/SubscriptionCard";
import { getClientSession } from "@/lib/clientAuth";

interface UserProfile {
  id?: string;
  _id?: string;
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
  profileImageUrl?: string;
  profileImagePublicId?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleUserUpdated = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
    setError("");
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  useEffect(() => {
    const handleExternalUserUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };

    window.addEventListener(
      "sohozkaj:user-updated",
      handleExternalUserUpdate,
    );

    return () =>
      window.removeEventListener(
        "sohozkaj:user-updated",
        handleExternalUserUpdate,
      );
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await getClientSession();

        if (!session.authenticated) {
          router.replace("/login");
          return;
        }

        if (session.user) {
          setUser(session.user as UserProfile);
          localStorage.setItem("user", JSON.stringify(session.user));
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-5 py-3 text-xs font-semibold text-gray-600 shadow-sm">
          <Loader2 size={16} className="animate-spin text-[#2563EB]" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-800 font-sans pb-12">
      <DashboardNavbar />

      <main className="max-w-[1000px] mx-auto px-4 py-8 sm:py-10 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={17} className="text-[#2563EB]" />
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>

          <p className="text-xs text-gray-400 font-medium mt-1">
            Your profile and subscription overview.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <ProfileHeader user={user} onUserUpdated={handleUserUpdated} />
        <SubscriptionCard />
      </main>
    </div>
  );
}
