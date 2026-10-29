import { T } from "@/components/i18n/I18nProvider";
import React from "react";
import { Mail, Phone } from "lucide-react";
import { useSiteSettings } from "@/app/_components/SiteSettingsProvider";
import { getContactList } from "@/app/_components/contactSettings";
export default function Helpline() {
    const { settings } = useSiteSettings();
    const emails = getContactList(settings.contact, "emails");
    const phones = getContactList(settings.contact, "phones");
    return (<section className="w-full bg-[#F8FAFC] pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#EFF6FF]/70 border border-[#E2E8F0] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider mb-1"><T>{"\u09B9\u09C7\u09B2\u09CD\u09AA\u09B2\u09BE\u0987\u09A8\r\n            "}</T></h4>
            <p className="text-sm md:text-base font-medium text-[#0F172A]"><T>{"\u09AF\u09C7\u0995\u09CB\u09A8\u09CB \u09AC\u09BF\u09B7\u09DF\u09C7 \u09B8\u09B9\u09AF\u09CB\u0997\u09BF\u09A4\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09AF\u09CB\u0997\u09BE\u09AF\u09CB\u0997 \u0995\u09B0\u09C1\u09A8:\r\n            "}</T></p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#475569] font-medium">
            {emails.map((email, index) => <a key={`${email}-${index}`} href={`mailto:${email}`} className="flex items-center gap-2 hover:text-[#2563EB] transition-colors bg-white px-3.5 py-2 rounded-xl border border-[#E2E8F0] shadow-sm">
              <Mail size={16} className="text-[#2563EB]"/>
              <span className="text-[#64748B]">{email}</span>
            </a>)}

            {phones.map((phone, index) => <a key={`${phone}-${index}`} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-[#2563EB] transition-colors bg-white px-3.5 py-2 rounded-xl border border-[#E2E8F0] shadow-sm">
              <Phone size={16} className="text-[#10B981]"/>
              <span className="text-[#64748B]">{phone}</span>
            </a>)}
          </div>
        </div>
      </div>
    </section>);
}
