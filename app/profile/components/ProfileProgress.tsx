import { CheckCircle2, Sparkles } from "lucide-react";

export default function ProfileProgress({
  profileCompletion,
  missingPercentage,
}: {
  profileCompletion: number;
  missingPercentage: number;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              profileCompletion >= 100
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {profileCompletion >= 100 ? (
              <CheckCircle2 size={12} />
            ) : (
              <Sparkles size={12} />
            )}

            {profileCompletion >= 100
              ? "Profile Complete"
              : "Profile Info Incomplete"}
          </span>

          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            18 Credit Bonus
          </span>
        </div>

        <span className="text-sm font-black text-red-500">
          {profileCompletion}%
        </span>
      </div>

      <p className="text-xs text-gray-400 font-medium">
        {profileCompletion >= 100
          ? "Your profile information is complete."
          : `Your profile is ${profileCompletion}% complete. Complete the remaining information to improve your profile.`}
      </p>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div
          className="bg-red-500 h-full rounded-full transition-all duration-300"
          style={{
            width: `${profileCompletion}%`,
          }}
        />
      </div>

      <p className="text-[10px] text-gray-400">
        {missingPercentage === 0
          ? "Everything is filled in."
          : `${missingPercentage}% of your profile is still incomplete.`}
      </p>
    </div>
  );
}
