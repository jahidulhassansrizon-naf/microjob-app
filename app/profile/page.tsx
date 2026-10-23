"use client";
import { T, useProfileText } from "./components/profileI18n";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
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
    const { t } = useProfileText();
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
        window.addEventListener("sohozkaj:user-updated", handleExternalUserUpdate);
        return () => window.removeEventListener("sohozkaj:user-updated", handleExternalUserUpdate);
    }, []);
    useEffect(() => {
        try {
            const cached = localStorage.getItem("user");
            if (cached)
                setUser(JSON.parse(cached) as UserProfile);
        }
        catch {
            localStorage.removeItem("user");
        }
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
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Unable to load your profile.");
            }
            finally {
                setLoading(false);
            }
        };
        void loadProfile();
    }, [router]);
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

      <main className="max-w-[1000px] mx-auto px-4 py-8 sm:py-10 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-[#3B2F1E]"><T>{"My Profile"}</T></h1>
          </div>

          <p className="text-sm text-[#7A6A50] font-medium mt-1"><T>{"Your profile and subscription overview.\n          "}</T></p>
        </div>

        {error && (<div className="bg-[#FEE9E9] border border-[#FBB6B6] rounded-2xl px-4 py-3 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5"/>

            <p className="text-sm text-red-600">{t(error)}</p>
          </div>)}

        <ProfileHeader user={user} onUserUpdated={handleUserUpdated}/>

        <SubscriptionCard />
      </main>
    </div>);
}
