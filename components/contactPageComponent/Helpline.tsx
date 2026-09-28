import React from "react";
import { Mail, Phone } from "lucide-react";

export default function Helpline() {
  return (
    <section className="w-full bg-[#F8FAFC] pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#EFF6FF]/70 border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider mb-1">
              হেল্পলাইন
            </h4>
            <p className="text-sm md:text-base font-medium text-[#0F172A]">
              যেকোনো বিষয়ে সহযোগিতার জন্য যোগাযোগ করুন:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#475569] font-medium">
            <a
              href="#"
              className="flex items-center gap-2 hover:text-[#2563EB] transition-colors bg-white px-3.5 py-2 rounded-xl border border-[#E2E8F0] shadow-sm"
            >
              <Mail size={16} className="text-[#2563EB]" />
              <span className="italic text-[#64748B]">
                Email address will be updated soon...
              </span>
            </a>

            <a
              href="#"
              className="flex items-center gap-2 hover:text-[#2563EB] transition-colors bg-white px-3.5 py-2 rounded-xl border border-[#E2E8F0] shadow-sm"
            >
              <Phone size={16} className="text-[#10B981]" />
              <span className="italic text-[#64748B]">
                Phone number will be updated soon...
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
