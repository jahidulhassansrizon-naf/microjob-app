import { T } from "./profileI18n";
export const tabs = [
  "Personal Information",
  "Shop / Business Information",
  "Change Password",
  "Devices login",
] as const;

export type Tab = (typeof tabs)[number];

export default function ProfileTabs({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === tab
              ? "bg-[#DC2626] text-white shadow-xs"
              : "bg-[#FBF6E8] text-[#5A4A32] border border-[#E3D6B8] hover:bg-[#F6EEDB]"
          }`}
        >
          <T>{tab}</T>
        </button>
      ))}
    </div>
  );
}
