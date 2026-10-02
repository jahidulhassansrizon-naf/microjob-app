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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all border text-left ${
            activeTab === tab
              ? "bg-[#2563EB] text-white border-[#2563EB] shadow-xs"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
