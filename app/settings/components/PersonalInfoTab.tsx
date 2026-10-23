import { T, useSettingsText } from "./settingsI18n";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Loader2, Save, X } from "lucide-react";
import { InputField, SelectField } from "./FormFields";
import UserInfoCard from "./UserInfoCard";
export type ProfileFormData = {
    fullName: string;
    phoneNumber: string;
    country: string;
    profession: string;
    gender: string;
    dob: string;
    address: string;
    district: string;
    thana: string;
    postcode: string;
    about: string;
};
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
export default function PersonalInfoTab({ user, profileForm, setProfileForm, isEditOpen, setIsEditOpen, onEdit, onSubmit, savingProfile, isEmailVerified, verifyingEmail, onSendVerification, }: {
    user: UserInfo | null;
    profileForm: ProfileFormData;
    setProfileForm: Dispatch<SetStateAction<ProfileFormData>>;
    isEditOpen: boolean;
    setIsEditOpen: Dispatch<SetStateAction<boolean>>;
    onEdit: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    savingProfile: boolean;
    isEmailVerified: boolean;
    verifyingEmail: boolean;
    onSendVerification: () => void;
}) {
    const { t } = useSettingsText();
    return (<>
      <UserInfoCard user={user} isEmailVerified={isEmailVerified} verifyingEmail={verifyingEmail} onEdit={onEdit} onSendVerification={onSendVerification}/>

      {isEditOpen && (<div className="fixed inset-0 z-50 bg-[#3B2F1E]/40 backdrop-blur-sm p-4 overflow-y-auto" onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    setIsEditOpen(false);
                }
            }}>
          <div className="min-h-full flex items-center justify-center py-8">
            <div className="w-full max-w-3xl bg-[#FBF6E8] rounded-2xl shadow-2xl border border-[#E3D6B8]">
              <form onSubmit={onSubmit}>
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E3D6B8]">
                  <div>
                    <h2 className="text-lg font-bold text-[#3B2F1E]"><T>{"Edit Personal Information\n                    "}</T></h2>

                    <p className="text-[13px] text-[#7A6A50] mt-0.5"><T>{"Update your information and save it to your account.\n                    "}</T></p>
                  </div>

                  <button type="button" onClick={() => setIsEditOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F3E9D2] flex items-center justify-center">
                    <X size={16}/>
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Full Name" value={profileForm.fullName} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                fullName: value,
            }))} placeholder="Enter full name" required/>

                  <InputField label="Phone Number" value={profileForm.phoneNumber} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                phoneNumber: value,
            }))} placeholder="Enter phone number" type="tel"/>

                  <InputField label="Country" value={profileForm.country} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                country: value,
            }))} placeholder="Bangladesh"/>

                  <InputField label="Profession / Designation" value={profileForm.profession} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                profession: value,
            }))} placeholder="e.g. Developer"/>

                  <SelectField label="Gender" value={profileForm.gender} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                gender: value,
            }))} options={["", "Male", "Female", "Other"]}/>

                  <InputField label="Date of Birth" value={profileForm.dob} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                dob: value,
            }))} type="date"/>

                  <InputField label="District" value={profileForm.district} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                district: value,
            }))} placeholder="Enter district"/>

                  <InputField label="Thana / Upazila" value={profileForm.thana} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                thana: value,
            }))} placeholder="Enter thana / upazila"/>

                  <InputField label="Postcode" value={profileForm.postcode} onChange={(value) => setProfileForm((previous) => ({
                ...previous,
                postcode: value,
            }))} placeholder="Enter postcode"/>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#5A4A32] mb-1.5"><T>{"Address\n                    "}</T></label>

                    <textarea rows={3} value={profileForm.address} onChange={(event) => setProfileForm((previous) => ({
                ...previous,
                address: event.target.value,
            }))} placeholder={t("Enter your address")} className="w-full resize-y rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#5A4A32] mb-1.5"><T>{"About\n                    "}</T></label>

                    <textarea rows={4} value={profileForm.about} onChange={(event) => setProfileForm((previous) => ({
                ...previous,
                about: event.target.value,
            }))} placeholder={t("Tell us a little about yourself")} className="w-full resize-y rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#E3D6B8]">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-xl text-sm font-bold border border-[#E3D6B8] hover:bg-[#F6EEDB]"><T>{"Cancel\n                  "}</T></button>

                  <button type="submit" disabled={savingProfile} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#DC2626] hover:bg-[#DC2626] text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                    {savingProfile ? (<Loader2 size={13} className="animate-spin"/>) : (<Save size={13}/>)}

                    {savingProfile ? <T>{"Saving..."}</T> : <T>{"Save Changes"}</T>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>)}
    </>);
}
