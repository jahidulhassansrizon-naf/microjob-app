import React from "react";
import { Mail, Phone } from "lucide-react";

export default function Helpline() {
  return (
    <section className="w-full bg-gray-50 pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
              হেল্পলাইন
            </h4>
            <p className="text-sm md:text-base font-medium text-gray-800">
              যেকোনো বিষয়ে সহযোগিতার জন্য যোগাযোগ করুন:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-700 font-medium">
            <a
              href="mailto:hello@sohozkaj.com"
              className="flex items-center gap-2 hover:text-sky-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-sky-100 shadow-sm"
            >
              <Mail size={16} className="text-sky-500" />
              <span>hello@sohozkaj.com</span>
            </a>

            <a
              href="tel:+8801700000000"
              className="flex items-center gap-2 hover:text-sky-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-sky-100 shadow-sm"
            >
              <Phone size={16} className="text-sky-500" />
              <span>+88 01700-000000</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
