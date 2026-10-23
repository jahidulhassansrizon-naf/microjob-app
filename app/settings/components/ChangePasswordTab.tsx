import { T, useSettingsText } from "./settingsI18n";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { LockKeyhole, Loader2, Save } from "lucide-react";
import PasswordField from "./PasswordField";
export type PasswordFormData = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};
export default function ChangePasswordTab({ passwordForm, setPasswordForm, savingPassword, showCurrentPassword, showNewPassword, showConfirmPassword, setShowCurrentPassword, setShowNewPassword, setShowConfirmPassword, onSubmit, }: {
    passwordForm: PasswordFormData;
    setPasswordForm: Dispatch<SetStateAction<PasswordFormData>>;
    savingPassword: boolean;
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    showConfirmPassword: boolean;
    setShowCurrentPassword: Dispatch<SetStateAction<boolean>>;
    setShowNewPassword: Dispatch<SetStateAction<boolean>>;
    setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
    return (<form onSubmit={onSubmit} className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-xs space-y-5 max-w-2xl">
      <div className="border-b border-[#E3D6B8] pb-3">
        <div className="flex items-center gap-2 text-base font-bold text-[#3B2F1E]">
          <LockKeyhole size={17} className="text-[#DC2626]"/><T>{"Change Password\n        "}</T></div>

        <p className="text-[13px] text-[#7A6A50] mt-1"><T>{"Use at least 8 characters for your new password.\n        "}</T></p>
      </div>

      <PasswordField label="Current Password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((previous) => ({
            ...previous,
            currentPassword: value,
        }))} visible={showCurrentPassword} onToggle={() => setShowCurrentPassword((previous) => !previous)}/>

      <PasswordField label="New Password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((previous) => ({
            ...previous,
            newPassword: value,
        }))} visible={showNewPassword} onToggle={() => setShowNewPassword((previous) => !previous)}/>

      <PasswordField label="Confirm New Password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((previous) => ({
            ...previous,
            confirmPassword: value,
        }))} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((previous) => !previous)}/>

      <div className="flex justify-end">
        <button type="submit" disabled={savingPassword} className="bg-[#DC2626] hover:bg-[#DC2626] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2">
          {savingPassword ? (<Loader2 size={13} className="animate-spin"/>) : (<Save size={13}/>)}

          {savingPassword ? <T>{"Updating..."}</T> : <T>{"Update Password"}</T>}
        </button>
      </div>
    </form>);
}
