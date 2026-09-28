import { Edit, Loader2, Mail, User } from "lucide-react";

type UserInfo = {
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
};

function renderField(
  label: string,
  value: string | number | undefined,
  className = "bg-gray-50/80 border-gray-100",
) {
  return (
    <div className={`p-2.5 rounded-xl border ${className}`}>
      <p className="text-[10px] font-bold text-gray-400">{label}</p>

      <p className="font-semibold text-gray-800 mt-0.5 break-words">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function UserInfoCard({
  user,
  isEmailVerified,
  verifyingEmail,
  onEdit,
  onSendVerification,
}: {
  user: UserInfo | null;
  isEmailVerified: boolean;
  verifyingEmail: boolean;
  onEdit: () => void;
  onSendVerification: () => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 min-w-0">
          <User size={16} className="text-[#2563EB] shrink-0" />

          <span className="truncate">{user?.fullName || "Guest User"}</span>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="bg-[#2563EB] hover:bg-[#2563EB] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Edit size={12} />
          <span>Edit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {renderField("Full Name", user?.fullName)}

        {renderField("Phone Number", user?.phoneNumber)}

        {renderField("Country", user?.country || "Bangladesh")}

        <div
          className={`p-2.5 rounded-xl border ${
            isEmailVerified
              ? "bg-emerald-50/50 border-emerald-100"
              : "bg-red-50/50 border-red-100"
          }`}
        >
          <p className="text-[10px] font-bold text-gray-400">Email</p>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="font-semibold text-gray-800 break-all">
              {user?.email || "Not provided"}
            </span>

            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                isEmailVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {isEmailVerified ? "Verified" : "Not verified"}
            </span>
          </div>

          {!isEmailVerified && user?.email && (
            <div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-red-100/60">
              <span className="text-[10px] text-red-500 font-medium">
                Verify your email to earn the bonus
              </span>

              <button
                type="button"
                onClick={onSendVerification}
                disabled={verifyingEmail}
                className="bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0"
              >
                {verifyingEmail ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Mail size={10} />
                )}

                <span>{verifyingEmail ? "Sending..." : "Verify"}</span>
              </button>
            </div>
          )}
        </div>

        {renderField(
          "Profession / Designation",
          user?.profession,
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField(
          "Gender",
          user?.gender,
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField(
          "Date of Birth",
          user?.dob ? user.dob.slice(0, 10) : "",
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField(
          "Address",
          user?.address,
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField("District", user?.district)}

        {renderField(
          "Thana / Upazila",
          user?.thana,
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField(
          "Postcode",
          user?.postcode,
          "bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}

        {renderField(
          "About yourself",
          user?.about,
          "md:col-span-2 bg-[#E2E8F0]/40 border-[#E2E8F0]/50",
        )}
      </div>
    </div>
  );
}
