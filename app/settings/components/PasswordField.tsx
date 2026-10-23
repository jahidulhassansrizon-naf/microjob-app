import { Eye, EyeOff } from "lucide-react";
import { useSettingsText } from "./settingsI18n";

export default function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  const { t } = useSettingsText();
  return (
    <div>
      <label className="block text-sm font-bold text-[#5A4A32] mb-1.5">
        {t(label)}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 px-3 text-[#7A6A50] hover:text-[#5A4A32]"
          aria-label={t(visible ? "Hide password" : "Show password")}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
