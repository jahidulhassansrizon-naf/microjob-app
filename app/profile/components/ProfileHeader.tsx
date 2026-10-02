import { UserRound } from "lucide-react";

type UserProfile = {
  fullName?: string;
};

function getInitials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileHeader({ user }: { user: UserProfile | null }) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col items-center justify-center text-center gap-4">
        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-blue-50 text-[#2563EB] ring-1 ring-inset ring-blue-100 flex items-center justify-center">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {getInitials(user?.fullName)}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.16em]">
            <UserRound size={13} />
            Profile
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
            {user?.fullName || "User Account"}
          </h2>
        </div>
      </div>
    </section>
  );
}
