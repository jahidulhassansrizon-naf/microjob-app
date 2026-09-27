import { Coins } from "lucide-react";

type UserProfile = {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
};

function getInitials(name?: string) {
  if (!name?.trim()) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function ProfileHeader({
  user,
  credits,
}: {
  user: UserProfile | null;
  credits: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0">
          {getInitials(user?.fullName)}
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">
            {user?.fullName || "Guest User"}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
            <span>📞 {user?.phoneNumber || "Not provided"}</span>

            <span className="break-all">
              ✉️ {user?.email || "Not provided"}
            </span>

            <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
              🌍 {user?.country || "Bangladesh"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 px-4 flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
          <Coins size={18} />
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-gray-400">
            Credit Balance
          </p>

          <p className="text-sm font-bold text-amber-600">
            Credits <span className="text-base">{credits}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
