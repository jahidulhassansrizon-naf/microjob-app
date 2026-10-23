import { useProfileText } from "./profileI18n";
import type { ChangeEvent } from "react";

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
  const { t } = useProfileText();
  return (
    <div>
      <label className="block text-sm font-bold text-[#5A4A32] mb-1.5">
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
        className="w-full rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
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
  const { t } = useProfileText();
  return (
    <div>
      <label className="block text-sm font-bold text-[#5A4A32] mb-1.5">
        {t(label)}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-[#E3D6B8] bg-[#F6EEDB] px-3 py-2.5 text-sm outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
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
