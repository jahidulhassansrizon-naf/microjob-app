import { T, useSettingsText } from "./settingsI18n";
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
function renderField(label: string, value: string | number | undefined, t: (value: string) => string, className = "bg-[#F6EEDB]/80 border-[#E3D6B8]") {
    const displayValue = !value
        ? t("Not provided")
        : label === "Country" && String(value).toLowerCase() === "bangladesh"
            ? t("Bangladesh")
            : label === "Gender"
                ? t(String(value))
                : value;
    return (<div className={`p-2.5 rounded-xl border ${className}`}>
      <p className="text-[12px] font-bold text-[#7A6A50]">{t(label)}</p>

      <p className="font-semibold text-[#3B2F1E] mt-0.5 break-words">
        {displayValue}
      </p>
    </div>);
}
export default function UserInfoCard({ user, isEmailVerified, verifyingEmail, onEdit, onSendVerification, }: {
    user: UserInfo | null;
    isEmailVerified: boolean;
    verifyingEmail: boolean;
    onEdit: () => void;
    onSendVerification: () => void;
}) {
    const { t } = useSettingsText();
    return (<div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3 gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#5A4A32] min-w-0">
          <User size={16} className="text-[#DC2626] shrink-0"/>

          <span className="truncate">{user?.fullName || t("Guest User")}</span>
        </div>

        <button type="button" onClick={onEdit} className="bg-[#DC2626] hover:bg-[#DC2626] text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0">
          <Edit size={12}/>
          <span><T>{"Edit"}</T></span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {renderField("Full Name", user?.fullName, t)}

        {renderField("Phone Number", user?.phoneNumber, t)}

        {renderField("Country", user?.country ? (user.country.toLowerCase() === "bangladesh" ? "Bangladesh" : user.country) : "Bangladesh", t)}

        <div className={`p-2.5 rounded-xl border ${isEmailVerified
            ? "bg-emerald-50/50 border-emerald-100"
            : "bg-[#FEE9E9]/50 border-[#FBB6B6]"}`}>
          <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"Email"}</T></p>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="font-semibold text-[#3B2F1E] break-all">
              {user?.email || t("Not provided")}
            </span>

            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${isEmailVerified
            ? "bg-emerald-100 text-emerald-700"
            : "bg-[#FBB6B6]/50 text-red-600"}`}>
              {isEmailVerified ? <T>{"Verified"}</T> : <T>{"Not verified"}</T>}
            </span>
          </div>

          {!isEmailVerified && user?.email && (<div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-[#FBB6B6]/60">
              <span className="text-[12px] text-red-500 font-medium"><T>{"Verify your email to earn the bonus\n              "}</T></span>

              <button type="button" onClick={onSendVerification} disabled={verifyingEmail} className="bg-[#FBF6E8] border border-[#E3D6B8] hover:bg-[#F6EEDB] disabled:opacity-60 disabled:cursor-not-allowed text-[#5A4A32] text-[12px] font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0">
                {verifyingEmail ? (<Loader2 size={10} className="animate-spin"/>) : (<Mail size={10}/>)}

                <span>{verifyingEmail ? <T>{"Sending..."}</T> : <T>{"Verify"}</T>}</span>
              </button>
            </div>)}
        </div>

        {renderField("Profession / Designation", user?.profession, t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("Gender", user?.gender ? t(user.gender) : user?.gender, t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("Date of Birth", user?.dob ? user.dob.slice(0, 10) : "", t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("Address", user?.address, t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("District", user?.district, t)}

        {renderField("Thana / Upazila", user?.thana, t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("Postcode", user?.postcode, t, "bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}

        {renderField("About yourself", user?.about, t, "md:col-span-2 bg-[#E3D6B8]/40 border-[#E3D6B8]/50")}
      </div>
    </div>);
}
