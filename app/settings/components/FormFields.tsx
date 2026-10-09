import type { ChangeEvent } from "react";
import { useSettingsText } from "./settingsI18n";

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  const { t } = useSettingsText();
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {t(label)}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
        placeholder={placeholder ? t(placeholder) : undefined}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const { t } = useSettingsText();
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">
        {t(label)}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option ? t(option) : t(`Select ${label.toLowerCase()}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
