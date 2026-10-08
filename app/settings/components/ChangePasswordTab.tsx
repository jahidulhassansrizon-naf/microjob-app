import { T } from "@/components/i18n/I18nProvider";
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
    return (<form onSubmit={onSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-5 max-w-2xl">
      <div className="border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <LockKeyhole size={17} className="text-[#2563EB]"/><T>{"Change Password\n        "}</T></div>

        <p className="text-[11px] text-gray-400 mt-1"><T>{"Use at least 8 characters for your new password.\n        "}</T></p>
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
        <button type="submit" disabled={savingPassword} className="bg-[#2563EB] hover:bg-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
          {savingPassword ? (<Loader2 size={13} className="animate-spin"/>) : (<Save size={13}/>)}

          {savingPassword ? <T>{"Updating..."}</T> : <T>{"Update Password"}</T>}
        </button>
      </div>
    </form>);
}
