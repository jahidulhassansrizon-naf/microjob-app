import { T, useSettingsText } from "./settingsI18n";
import { Info, Loader2, RefreshCw } from "lucide-react";
type DeviceSession = {
    id: string;
    deviceName?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    loginAt?: string;
    lastActive?: string;
    current?: boolean;
};
export default function DevicesLoginTab({ devices, loadingDevices, onRefresh, }: {
    devices: DeviceSession[];
    loadingDevices: boolean;
    onRefresh: () => void;
}) {
    const { t, locale } = useSettingsText();
    const isBangla = String(locale || "").toLowerCase().startsWith("bn");
    const formatTime = (value?: string) => {
        if (!value)
            return t("Unknown");
        const date = new Date(value);
        if (Number.isNaN(date.getTime()))
            return t("Unknown");
        return date.toLocaleString(isBangla ? "bn-BD" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
    };
    const translateName = (name?: string) => name
        ? name.split(" • ").map((part) => t(part)).join(" • ")
        : t("Unknown device");
    return (<div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E3D6B8] pb-3">
        <div>
          <h2 className="text-base font-bold text-[#3B2F1E]"><T>{"Devices login"}</T></h2>

          <p className="text-[13px] text-[#7A6A50] mt-1"><T>{"Review the devices currently associated with your account."}</T></p>
        </div>

        <button type="button" onClick={onRefresh} disabled={loadingDevices} className="border border-[#E3D6B8] hover:bg-[#F6EEDB] disabled:opacity-60 rounded-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
          <RefreshCw size={12} className={loadingDevices ? "animate-spin" : ""}/><T>{"Refresh"}</T></button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]/70 px-3 py-2.5 text-[13px] text-[#5A4A32]">
        <Info size={15} className="mt-0.5 shrink-0 text-[#DC2626]"/>
        <p><T>{"Your account can be logged in on only one device at a time. If you log in on another device, this device will be logged out automatically."}</T></p>
      </div>

      {loadingDevices ? (<div className="py-10 flex items-center justify-center gap-2 text-sm text-[#6B5A40] font-semibold">
          <Loader2 size={15} className="animate-spin text-[#DC2626]"/><T>{"Loading devices..."}</T></div>) : devices.length === 0 ? (<div className="py-10 text-center">
          <p className="text-sm font-bold text-[#5A4A32]"><T>{"No device data found"}</T></p>

          <p className="text-[13px] text-[#7A6A50] mt-1"><T>{"Your devices API returned no active sessions."}</T></p>
        </div>) : (<div className="space-y-3">
          {devices.map((device) => (<div key={device.id} className="rounded-xl border border-[#E3D6B8] bg-[#F6EEDB]/70 p-3 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#3B2F1E]">
                  {translateName(device.deviceName)}
                </p>

                {device.current && (<span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700"><T>{"Current device"}</T></span>)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                <div>
                  <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"Browser"}</T></p>
                  <p className="text-[#5A4A32] font-semibold mt-0.5">{device.browser || t("Unknown")}</p>
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"Location"}</T></p>
                  <p className="text-[#5A4A32] font-semibold mt-0.5">{device.location || t("Unknown")}</p>
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"IP address"}</T></p>
                  <p className="text-[#5A4A32] font-semibold mt-0.5 break-all">{device.ipAddress || t("Unknown")}</p>
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"Logged in at"}</T></p>
                  <p className="text-[#5A4A32] font-semibold mt-0.5">{formatTime(device.loginAt)}</p>
                </div>

                <div>
                  <p className="text-[12px] font-bold text-[#7A6A50]"><T>{"Last active"}</T></p>
                  <p className="text-[#5A4A32] font-semibold mt-0.5">{formatTime(device.lastActive)}</p>
                </div>
              </div>
            </div>))}
        </div>)}
    </div>);
}
