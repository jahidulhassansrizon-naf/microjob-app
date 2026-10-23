import { T, useSettingsText } from "./settingsI18n";
import { Loader2, RefreshCw } from "lucide-react";
type DeviceSession = {
    id: string;
    deviceName?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    lastActive?: string;
    current?: boolean;
};
export default function DevicesLoginTab({ devices, loadingDevices, onRefresh, }: {
    devices: DeviceSession[];
    loadingDevices: boolean;
    onRefresh: () => void;
}) {
    const { t } = useSettingsText();
    return (<div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#3B2F1E]"><T>{"Devices login"}</T></h2>

          <p className="text-[13px] text-[#7A6A50] mt-1"><T>{"Review the devices currently associated with your account.\n          "}</T></p>
        </div>

        <button type="button" onClick={onRefresh} disabled={loadingDevices} className="border border-[#E3D6B8] hover:bg-[#F6EEDB] disabled:opacity-60 rounded-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
          <RefreshCw size={12} className={loadingDevices ? "animate-spin" : ""}/><T>{"Refresh\n        "}</T></button>
      </div>

      {loadingDevices ? (<div className="py-10 flex items-center justify-center gap-2 text-sm text-[#6B5A40] font-semibold">
          <Loader2 size={15} className="animate-spin text-[#DC2626]"/><T>{"Loading devices...\n        "}</T></div>) : devices.length === 0 ? (<div className="py-10 text-center">
          <p className="text-sm font-bold text-[#5A4A32]"><T>{"No device data found"}</T></p>

          <p className="text-[13px] text-[#7A6A50] mt-1"><T>{"Your devices API returned no active sessions.\n          "}</T></p>
        </div>) : (<div className="space-y-3">
          {devices.map((device) => (<div key={device.id} className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]/70 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#3B2F1E]">
                    {device.deviceName || t("Unknown device")}
                  </p>

                  {device.current && (<span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700"><T>{"Current device\n                    "}</T></span>)}
                </div>

                <p className="text-[13px] text-[#6B5A40] mt-1">
                  {[device.browser, device.location, device.ipAddress]
                    .filter(Boolean)
                    .join(" • ") || t("Device details unavailable")}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[12px] font-bold text-[#7A6A50] uppercase"><T>{"Last active\n                "}</T></p>

                <p className="text-[13px] text-[#5A4A32] font-semibold mt-0.5">
                  {device.lastActive ? t(device.lastActive) : t("Unknown")}
                </p>
              </div>
            </div>))}
        </div>)}
    </div>);
}
