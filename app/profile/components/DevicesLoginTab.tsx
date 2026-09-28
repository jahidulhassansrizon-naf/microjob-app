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

export default function DevicesLoginTab({
  devices,
  loadingDevices,
  onRefresh,
}: {
  devices: DeviceSession[];
  loadingDevices: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Devices login</h2>

          <p className="text-[11px] text-gray-400 mt-1">
            Review the devices currently associated with your account.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loadingDevices}
          className="border border-gray-200 hover:bg-gray-50 disabled:opacity-60 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw
            size={12}
            className={loadingDevices ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {loadingDevices ? (
        <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-500 font-semibold">
          <Loader2 size={15} className="animate-spin text-[#2563EB]" />
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs font-bold text-gray-700">No device data found</p>

          <p className="text-[11px] text-gray-400 mt-1">
            Your devices API returned no active sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-gray-800">
                    {device.deviceName || "Unknown device"}
                  </p>

                  {device.current && (
                    <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
                      Current device
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mt-1">
                  {[device.browser, device.location, device.ipAddress]
                    .filter(Boolean)
                    .join(" • ") || "Device details unavailable"}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  Last active
                </p>

                <p className="text-[11px] text-gray-700 font-semibold mt-0.5">
                  {device.lastActive || "Unknown"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
