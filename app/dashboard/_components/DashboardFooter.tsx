import { DT } from "./DashboardText";
// app/dashboard/_components/DashboardFooter.tsx
import Link from "next/link";
export default function DashboardFooter() {
    return (<footer className="w-full bg-white border-t border-gray-200/80 py-3 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium">
        {/* Left: Logo, Copyright & Version */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#FF5D00] rounded-md flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs"><DT>{"SK\r\n          "}</DT></div>
          <span><DT>{"\u00A9 2026"}</DT>{<DT>{" "}</DT>}
            <strong className="text-amber-600 font-bold"><DT>{"Sigmative"}</DT></strong><DT>{". All\r\n            rights reserved.\r\n          "}</DT></span>
          <span className="text-gray-300"><DT>{"\u00B7"}</DT></span>
          <span className="text-gray-400"><DT>{"v1.8.3"}</DT></span>
        </div>

        {/* Right: Policy Links */}
        <div className="flex items-center gap-4 text-gray-400">
          <Link href="#" className="hover:text-gray-700 transition-colors"><DT>{"Terms\r\n          "}</DT></Link>
          <Link href="#" className="hover:text-gray-700 transition-colors"><DT>{"Privacy Policy\r\n          "}</DT></Link>
          <Link href="#" className="hover:text-gray-700 transition-colors"><DT>{"Copyright\r\n          "}</DT></Link>
          <Link href="#" className="hover:text-gray-700 transition-colors"><DT>{"Refund Policy\r\n          "}</DT></Link>
        </div>
      </div>
    </footer>);
}
