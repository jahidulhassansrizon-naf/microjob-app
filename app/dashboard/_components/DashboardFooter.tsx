import { DT } from "./DashboardText";
// app/dashboard/_components/DashboardFooter.tsx
import Link from "next/link";
export default function DashboardFooter() {
    return (<footer className="w-full bg-[#F2E8D2] border-t border-[#E3D6B8]/80 py-3 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#7A6A50] font-medium">
        {/* Left: Logo, Copyright & Version */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-[#EF4444] to-[#B91C1C] rounded-md flex items-center justify-center text-[12px] font-black text-white shrink-0 shadow-2xs">SH</div>
          <span><DT>{"\u00A9 2026"}</DT>{<DT>{" "}</DT>}
            <strong className="text-[#DC2626] font-bold">Sohoj Hub</strong><DT>{". All\r\n            rights reserved.\r\n          "}</DT></span>
          <span className="text-[#B0A080]"><DT>{"\u00B7"}</DT></span>
          <span className="text-[#7A6A50]"><DT>{"v1.8.3"}</DT></span>
        </div>

        {/* Right: Policy Links */}
        <div className="flex items-center gap-4 text-[#7A6A50]">
          <Link href="/terms" className="hover:text-[#5A4A32] transition-colors"><DT>{"Terms\r\n          "}</DT></Link>
          <Link href="/privacy" className="hover:text-[#5A4A32] transition-colors"><DT>{"Privacy Policy\r\n          "}</DT></Link>
          <Link href="/copyright" className="hover:text-[#5A4A32] transition-colors"><DT>{"Copyright\r\n          "}</DT></Link>
        </div>
      </div>
    </footer>);
}
