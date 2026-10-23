import { useSettingsText } from "./settingsI18n";

const tabs = [
  "Personal Information",
  "Change Password",
  "Devices Login",
  "Business Information",
] as const;

export type SettingsTab = (typeof tabs)[number];

export default function SettingsTabs({
  activeTab,
  onChange,
}: {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  const { t } = useSettingsText();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all border text-left ${
            activeTab === tab
              ? "bg-[#DC2626] text-white border-[#DC2626] shadow-xs"
              : "bg-[#FBF6E8] text-[#5A4A32] border-[#E3D6B8] hover:bg-[#F6EEDB]"
          }`}
        >
          {t(tab)}
        </button>
      ))}
    </div>
  );
}
