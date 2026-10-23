import { T } from "./profileI18n";
import { CheckCircle2 } from "lucide-react";
export default function ProfileProgress({ profileCompletion, missingPercentage, }: {
    profileCompletion: number;
    missingPercentage: number;
}) {
    return (<div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-4 shadow-xs space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${profileCompletion >= 100
            ? "bg-emerald-50 text-emerald-600"
            : "bg-[#FEE9E9] text-red-500"}`}>
            {profileCompletion >= 100 ? (<CheckCircle2 size={12}/>) : null}

            {profileCompletion >= 100
        ? <T>{"Profile Complete"}</T> : <T>{"Profile Info Incomplete"}</T>}
          </span>

          <span className="bg-emerald-100 text-emerald-700 text-[12px] font-bold px-2 py-0.5 rounded-full"><T>{"18 Credit Bonus\n          "}</T></span>
        </div>

        <span className="text-base font-black text-red-500">
          {profileCompletion}<T>{"%\n        "}</T></span>
      </div>

      <p className="text-sm text-[#7A6A50] font-medium">
        {profileCompletion >= 100
        ? <T>{"Your profile information is complete."}</T> : <T>{`Your profile is ${profileCompletion}% complete. Complete the remaining information to improve your profile.`}</T>}
      </p>

      <div className="w-full bg-[#F3E9D2] h-2 rounded-full overflow-hidden">
        <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{
            width: `${profileCompletion}%`,
        }}/>
      </div>

      <p className="text-[12px] text-[#7A6A50]">
        {missingPercentage === 0
        ? <T>{"Everything is filled in."}</T> : <T>{`${missingPercentage}% of your profile is still incomplete.`}</T>}
      </p>
    </div>);
}
